package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/mux"
)

type Notes struct {
	next_id uint32
	content map[uint32]string
}

func (n *Notes) all() *map[uint32]string {
	return &n.content
}

func (n *Notes) add(text string) uint32 {
	n.content[n.next_id] = text
	n.next_id += 1
	return n.next_id - 1
}

func (n *Notes) get(id uint32) (string, error) {
	text, ok := n.content[id]
	if !ok {
		return "", fmt.Errorf("No such note")
	}
	return text, nil
}

func (n *Notes) set(id uint32, text string) error {
	_, ok := n.content[id]
	if !ok {
		return fmt.Errorf("No such note")
	}
	n.content[id] = text
	return nil
}

func (n *Notes) delete(id uint32) error {
	_, ok := n.content[id]
	if !ok {
		return fmt.Errorf("No such note")
	}
	delete(n.content, id)
	return nil
}

func getUint32(r *http.Request, field string) (uint32, error) {
	vars := mux.Vars(r)
	value, ok := vars[field]
	if !ok {
		panic("Invalid variable identifier")
	}
	value64, err := strconv.ParseUint(value, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("Invalid note identifier %d: %v", value, err)
	}
	return uint32(value64), nil
}

func main() {
	mu := sync.Mutex{}
	notes := Notes{content: make(map[uint32]string)}

	router := mux.NewRouter()

	router.HandleFunc("/note", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		response := make(map[string]string)
		for id, text := range *notes.all() {
			response[fmt.Sprintf("/note/%d", id)] = text
		}
		encoder := json.NewEncoder(w)
		if err := encoder.Encode(response); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}).Methods("GET")

	router.HandleFunc("/note", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		decoder := json.NewDecoder(r.Body)
		encoder := json.NewEncoder(w)
		text := ""
		if err := decoder.Decode(&text); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		id := notes.add(text)
		if err := encoder.Encode(fmt.Sprintf("/note/%d", id)); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}).Methods("POST")

	router.HandleFunc("/note/{id}", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		encoder := json.NewEncoder(w)
		id, err := getUint32(r, "id")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			encoder.Encode(err.Error())
			return
		}
		text, err := notes.get(id)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			encoder.Encode(err.Error())
			return
		}
		if err := encoder.Encode(text); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}).Methods("GET")

	router.HandleFunc("/note/{id}", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		decoder := json.NewDecoder(r.Body)
		encoder := json.NewEncoder(w)
		id, err := getUint32(r, "id")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			encoder.Encode(err.Error())
			return
		}
		text := ""
		if err := decoder.Decode(&text); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if err := notes.set(id, text); err != nil {
			w.WriteHeader(http.StatusNotFound)
			encoder.Encode(err.Error())
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}).Methods("UPDATE")

	router.HandleFunc("/note/{id}", func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		encoder := json.NewEncoder(w)
		id, err := getUint32(r, "id")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			encoder.Encode(err.Error())
			return
		}
		if err := notes.delete(id); err != nil {
			w.WriteHeader(http.StatusNotFound)
			encoder.Encode(err.Error())
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}).Methods("DELETE")

	log.Fatal(http.ListenAndServe("localhost:1234", router))
}
