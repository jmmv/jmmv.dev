all: wait-all
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S), Darwin)
all: wait-all-darwin
endif
ifeq ($(UNAME_S), Linux)
all: wait-all-linux
endif

.PHONY: clean
clean:
	rm -f wait-all wait-all-darwin wait-all-linux

wait-all: wait-all.c
wait-all-darwin: wait-all-darwin.c wait-pid-darwin.c wait-pgid-darwin.c
wait-all-linux: wait-all-linux.c
