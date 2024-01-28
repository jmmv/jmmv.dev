.PHONY: all
all:    unreal.com

unreal.com: unreal.asm
	nasm -o $@ $<

.PHONY: clean
clean:
	rm -f unreal.com
