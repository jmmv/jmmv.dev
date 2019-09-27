use std::collections::HashMap;
use std::result::Result;

/// Definition of a single task.
pub struct Task {
    /// The description of the task.
    pub text: String,

    /// Whether the task is complete or not.
    pub done: bool,
}

/// Container of tasks.
/// 
/// Tasks are identified by an integer and each points to a separate `Task`
/// object that describes that individual task.
/// 
/// The task manager is not thread-safe.
pub struct TaskManager {
    tasks: HashMap<usize, Task>,
    next_id: usize,
}

impl TaskManager {
    /// Creates a new task manager with no tasks.
    pub fn new() -> Self {
        Self { tasks: HashMap::new(), next_id: 0 }
    }

    /// Returns all tasks.
    pub fn all(&self) -> &HashMap<usize, Task> {
        &self.tasks
    }

    /// Adds a new undone task based on its textual description and returns
    /// the identifier assigned to it.
    pub fn add(&mut self, text: String) -> usize {
        let id = self.next_id;
        let task = Task { text: text, done: false };
        if self.tasks.insert(id, task).is_some() {
            panic!("Overwrote task; did next_id wrap?");
        }
        self.next_id += 1;
        id
    }

    /// Returns the task corresponding to the identifier `id` or an error
    /// message if not found.
    pub fn get(&mut self, id: usize) -> Result<&Task, &'static str> {
        self.tasks.get(&id).ok_or("No such task")
    }

    /// Updates the task corresponding to the identifier `id` with a new
    /// text and status.  If any parameter is set to `None`, the corresponding
    /// field in the task is left unmodified.  Returns an error message if the
    /// task is not found.
    pub fn set(&mut self, id: usize, text: Option<String>, done: Option<bool>)
        -> Result<(), &'static str> {

        self.tasks.get_mut(&id).map_or(
            Err("No such task"),
            |v| {
                if let Some(text) = text {
                    v.text = text;
                }
                if let Some(done) = done {
                    v.done = done;
                }
                Ok(())
            })
    }

    /// Deletes the task corresponding to the identifier `id` or an error
    /// message if not found.
    pub fn delete(&mut self, id: usize) -> Result<(), &'static str> {
        self.tasks.remove(&id).map_or(Err("No such task"), |_| Ok(()))
    }
}
