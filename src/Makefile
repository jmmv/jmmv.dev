.PHONY: all clean
all: rest-api-go
all: rest-api-rust
all: wait-for-process-group
clean: clean-rest-api-go
clean: clean-rest-api-rust
clean: wait-for-process-group

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

.PHONY: clean-wait-for-process-group wait-for-process-group
wait-for-process-group:
	( cd wait-for-process-group && make all )
clean-wait-for-process-group:
	( cd wait-for-process-group && make clean )
