.PHONY: all clean
all: builder-pattern-for-tests
all: cmdline-args-unix-vs-windows
all: djgpp
all: inline-array-go
all: ioctls-rust
all: netbsd-graphics-wo-x11
all: powershell-cmdlet-params
all: rest-api-go
all: rest-api-rust
all: unreal-mode
all: wait-for-process-group
clean: clean-builder-pattern-for-tests
clean: clean-cmdline-args-unix-vs-windows
clean: clean-djgpp
clean: clean-inline-array-go
clean: clean-ioctls-rust
clean: clean-netbsd-graphics-wo-x11
clean: clean-powershell-cmdlet-params
clean: clean-rest-api-go
clean: clean-rest-api-rust
clean: clean-unreal-mode
clean: clean-wait-for-process-group

.PHONY: clean-builder-pattern-for-tests builder-pattern-for-tests
builder-pattern-for-tests:
	( cd builder-pattern-for-tests && cargo build )
clean-builder-pattern-for-tests:
	( cd builder-pattern-for-tests && cargo clean )
	rm -f builder-pattern-for-tests/Cargo.lock

.PHONY: clean-cmdline-args-unix-vs-windows cmdline-args-unix-vs-windows
cmdline-args-unix-vs-windows:
	( cd cmdline-args-unix-vs-windows && make all )
clean-cmdline-args-unix-vs-windows:
	( cd cmdline-args-unix-vs-windows && make clean )

.PHONY: clean-djgpp djgpp
djgpp:
	( cd djgpp && make all )
clean-djgpp:
	( cd djgpp && make clean )

.PHONY: clean-inline-array-go inline-array-go
inline-array-go:
	( cd inline-array-go && go build )
clean-inline-array-go:
	( cd inline-array-go && go clean )

.PHONY: clean-ioctls-rust ioctls-rust
ioctls-rust:
	if [ "$$(uname -s)" = NetBSD ]; then ( cd ioctls-rust && cargo build ); fi
clean-ioctls-rust:
	( cd ioctls-rust && cargo clean )

.PHONY: clean-netbsd-graphics-wo-x11 netbsd-graphics-wo-x11
netbsd-graphics-wo-x11:
	if [ "$$(uname -s)" = NetBSD ]; then ( cd netbsd-graphics-wo-x11 && make all ); fi
clean-netbsd-graphics-wo-x11:
	( cd netbsd-graphics-wo-x11 && make clean )

.PHONY: clean-powershell-cmdlet-params powershell-cmdlet-params
powershell-cmdlet-params:
	( cd powershell-cmdlet-params && make all )
clean-powershell-cmdlet-params:
	( cd powershell-cmdlet-params && make clean )

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

.PHONY: clean-unreal-mode unreal-mode
unreal-mode:
	( cd unreal-mode && make all )
clean-unreal-mode:
	( cd unreal-mode && make clean )

.PHONY: clean-wait-for-process-group wait-for-process-group
wait-for-process-group:
	( cd wait-for-process-group && make all )
clean-wait-for-process-group:
	( cd wait-for-process-group && make clean )
