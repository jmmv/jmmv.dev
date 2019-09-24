.PHONY: all clean
all: rest-api-go rest-api-rust
clean: clean-rest-api-go clean-rest-api-rust

.PHONY: clean-rest-api-go rest-api-go
rest-api-go:
	( cd rest-api-go && go build notes.go )
clean-rest-api-go:
	( cd rest-api-go && go clean )
	rm -f rest-api-go/go.sum

.PHONY: clean-rest-api-rust rest-api-rust
rest-api-rust:
	( cd rest-api-rust && cargo build )
clean-rest-api-rust:
	( cd rest-api-rust && cargo clean )
	rm -f rest-api-rust/Cargo.lock
