all: wait-all wait-all-darwin wait-all-linux

.PHONY: clean
clean:
	rm -f wait-all wait-all-darwin wait-all-linux

wait-all: wait-all.c
wait-all-darwin: wait-all-darwin.c wait-pid-darwin.c wait-pgid-darwin.c
wait-all-linux: wait-all-linux.c
