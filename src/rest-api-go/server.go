package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"

	"rest-api-go/tasks"

	"github.com/gorilla/mux"
)

// getTaskResponse represents a task as a serializable JSON object.
type getTaskResponse struct {
	Text string `json:"text"`
	Done bool   `json:"done"`
}

// newGetTaskResponse constructs a new external version of a task given a
// task's definition.
func newGetTaskResponse(t tasks.Task) getTaskResponse {
	return getTaskResponse{Text: t.Text, Done: t.Done}
}

// updateTaskRequest represents a request to update zero or more fields of
// a task.
type updateTaskRequest struct {
	Text *string `json:"text,omitempty"`
	Done *bool   `json:"done,omitempty"`
}

// getUint32 gets a variable from a request as an uint32 and returns an
// error if the string value cannot be converted.
func getUint32(r *http.Request, field string) (uint32, error) {
	vars := mux.Vars(r)
	value, ok := vars[field]
	if !ok {
		panic("Invalid variable identifier")
	}
	value64, err := strconv.ParseUint(value, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid task identifier %s: %v", value, err)
	}
	return uint32(value64), nil
}

// handler is a convenience wrapper to implement the body of an HTTP handler.
// Takes care of ensuring the backing task manager is locked via the mu mutex,
// constructs a JSON decoder and encoder to handle the request and the response,
// and if the handler returns an error, responds to the HTTP request with the
// details.
func handler(mu *sync.Mutex, w http.ResponseWriter, r *http.Request,
	f func(encoder *json.Encoder, decoder *json.Decoder) (int, error)) {

	mu.Lock()
	defer mu.Unlock()
	encoder := json.NewEncoder(w)
	decoder := json.NewDecoder(r.Body)
	code, err := f(encoder, decoder)
	if err != nil {
		w.WriteHeader(code)
		encoder.Encode(err.Error())
	}
}

func main() {
	mu := sync.Mutex{}
	tm := tasks.NewTaskManager()

	router := mux.NewRouter()

	router.HandleFunc("/task", func(w http.ResponseWriter, r *http.Request) {
		handler(&mu, w, r, func(encoder *json.Encoder, decoder *json.Decoder) (int, error) {
			response := make(map[string]getTaskResponse)
			for id, task := range *tm.All() {
				path := fmt.Sprintf("/task/%d", id)
				response[path] = newGetTaskResponse(task)
			}
			if err := encoder.Encode(response); err != nil {
				return http.StatusInternalServerError, err
			}
			return 0, nil
		})
	}).Methods("GET")

	router.HandleFunc("/task", func(w http.ResponseWriter, r *http.Request) {
		handler(&mu, w, r, func(encoder *json.Encoder, decoder *json.Decoder) (int, error) {
			text := ""
			if err := decoder.Decode(&text); err != nil {
				return http.StatusInternalServerError, err
			}
			id := tm.Add(text)
			if err := encoder.Encode(fmt.Sprintf("/task/%d", id)); err != nil {
				return http.StatusInternalServerError, err
			}
			return 0, nil
		})
	}).Methods("POST")

	router.HandleFunc("/task/{id}", func(w http.ResponseWriter, r *http.Request) {
		handler(&mu, w, r, func(encoder *json.Encoder, decoder *json.Decoder) (int, error) {
			id, err := getUint32(r, "id")
			if err != nil {
				return http.StatusBadRequest, err
			}
			task, err := tm.Get(id)
			if err != nil {
				return http.StatusNotFound, err
			}
			if err := encoder.Encode(newGetTaskResponse(task)); err != nil {
				return http.StatusInternalServerError, err
			}
			return 0, nil
		})
	}).Methods("GET")

	router.HandleFunc("/task/{id}", func(w http.ResponseWriter, r *http.Request) {
		handler(&mu, w, r, func(encoder *json.Encoder, decoder *json.Decoder) (int, error) {
			id, err := getUint32(r, "id")
			if err != nil {
				return http.StatusBadRequest, err
			}
			update := updateTaskRequest{}
			if err := decoder.Decode(&update); err != nil {
				return http.StatusInternalServerError, err
			}
			if err := tm.Set(id, update.Text, update.Done); err != nil {
				return http.StatusNotFound, err
			}
			w.WriteHeader(http.StatusNoContent)
			return 0, nil
		})
	}).Methods("UPDATE")

	router.HandleFunc("/task/{id}", func(w http.ResponseWriter, r *http.Request) {
		handler(&mu, w, r, func(encoder *json.Encoder, decoder *json.Decoder) (int, error) {
			id, err := getUint32(r, "id")
			if err != nil {
				return http.StatusBadRequest, err
			}
			if err := tm.Delete(id); err != nil {
				return http.StatusNotFound, err
			}
			w.WriteHeader(http.StatusNoContent)
			return 0, nil
		})
	}).Methods("DELETE")

	log.Fatal(http.ListenAndServe("localhost:1234", router))
}
