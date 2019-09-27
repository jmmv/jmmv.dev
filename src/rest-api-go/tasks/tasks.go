package tasks

import (
	"fmt"
)

// Task represents a single task.
type Task struct {
	// Text contains the description of the task.
	Text string

	// Done contains whether the task is complete or not.
	Done bool
}

// TaskManager implements a container of tasks.
//
// Tasks are identified by an integer and each points to a separate Tas
// object that describes the individual task.
type TaskManager struct {
	nextID uint32
	tasks  map[uint32]Task
}

// NewTaskManager creates a new task manager with no tasks.
func NewTaskManager() TaskManager {
	return TaskManager{nextID: 0, tasks: make(map[uint32]Task)}
}

// All returns all tasks.
func (tm *TaskManager) All() *map[uint32]Task {
	return &tm.tasks
}

// Add adds a new undone task based on its textual representation and returns
// the identifier assigned to it.
func (tm *TaskManager) Add(text string) uint32 {
	id := tm.nextID
	tm.tasks[id] = Task{Text: text, Done: false}
	tm.nextID++
	return id
}

// Get returns the task corresponding to the given identifier or an error
// if not found.
func (tm *TaskManager) Get(id uint32) (Task, error) {
	task, ok := tm.tasks[id]
	if !ok {
		return Task{}, fmt.Errorf("no such task")
	}
	return task, nil
}

// Set updates the task corresponding to the given identifier with a new
// text and status.  If any parameter is nil, the corresponding field in the
// task is left unmodified.  Returns an error if the task is not found.
func (tm *TaskManager) Set(id uint32, text *string, done *bool) error {
	task, ok := tm.tasks[id]
	if !ok {
		return fmt.Errorf("no such task")
	}
	if text != nil {
		task.Text = *text
	}
	if done != nil {
		task.Done = *done
	}
	tm.tasks[id] = task
	return nil
}

// Delete deletes the task corresponding to the given identifier or an error
// if not found.
func (tm *TaskManager) Delete(id uint32) error {
	_, ok := tm.tasks[id]
	if !ok {
		return fmt.Errorf("no such task")
	}
	delete(tm.tasks, id)
	return nil
}
