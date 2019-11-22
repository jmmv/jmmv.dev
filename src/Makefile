.PHONY: all clean
all: inline-array-go
all: rest-api-go
all: rest-api-rust
all: wait-for-process-group
clean: clean-inline-array-go
clean: clean-rest-api-go
clean: clean-rest-api-rust
clean: clean-wait-for-process-group

.PHONY: clean-inline-array-go inline-array-go
inline-array-go:
	( cd inline-array-go && go build )
clean-inline-array-go:
	( cd inline-array-go && go clean )

.PHONY: clean-rest-api-go rest-api-go
rest-api-go:
	( cd rest-api-go && go build )
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
