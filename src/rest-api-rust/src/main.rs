#[macro_use] extern crate rouille;

use std::collections::HashMap;
use std::sync::Mutex;
use std::result::Result;

struct Notes {
    next_id: usize,
    content: HashMap<usize, String>,
}

impl Notes {
    fn new() -> Self {
        Self { next_id: 0, content: HashMap::new() }
    }

    fn all(&self) -> &HashMap<usize, String> {
        return &self.content
    }

    fn add(&mut self, text: String) -> usize {
        if self.content.insert(self.next_id, text).is_some() {
            panic!("Overwrote note");
        }
        self.next_id += 1;
        self.next_id - 1
    }

    fn get(&mut self, id: usize) -> Result<&String, &'static str> {
        self.content.get(&id).ok_or("No such note")
    }

    fn set(&mut self, id: usize, text: String) -> Result<(), &'static str> {
        self.content.get_mut(&id).map_or(Err("No such note"), |v| { *v = text; Ok(()) })
    }

    fn delete(&mut self, id: usize) -> Result<(), &'static str> {
        self.content.remove(&id).map_or(Err("No such note"), |_| Ok(()))
    }
}

fn route_request(request: &rouille::Request, notes: &Mutex<Notes>) -> rouille::Response {
    let mut notes = notes.lock().unwrap();

    router!(request,
        (GET) ["/note"] => {
            let mut response = HashMap::new();
            for (id, text) in notes.all().iter() {
                response.insert(format!("/note/{}", id), text);
            }
            rouille::Response::json(&response)
        },

        (POST) ["/note"] => {
            let body: String = try_or_400!(rouille::input::json_input(request));
            let id = notes.add(body);
            rouille::Response::json(&format!("/note/{}", id))
        },

        (GET) ["/note/{id}", id: usize] => {
            match notes.get(id) {
                Ok(text) => rouille::Response::json(&text),
                Err(e) => rouille::Response::json(&e).with_status_code(404),
            }
        },

        (UPDATE) ["/note/{id}", id: usize] => {
            let body: String = try_or_400!(rouille::input::json_input(request));
            match notes.set(id, body) {
                Ok(()) => rouille::Response::empty_204(),
                Err(e) => rouille::Response::json(&e).with_status_code(404),
            }
        },

        (DELETE) ["/note/{id}", id: usize] => {
            match notes.delete(id) {
                Ok(()) => rouille::Response::empty_204(),
                Err(e) => rouille::Response::json(&e).with_status_code(404),
            }
        },

        _ => rouille::Response::empty_404()
    )
}

fn main() {
    let notes = Mutex::from(Notes::new());

    rouille::start_server(
        "localhost:1234", move |request| route_request(request, &notes))
}
