all: wsdisplay-draw
all: wsdisplay-fbinfo
all: wskbd-map
all: wskbd-trivial

.PHONY: clean
clean:
	rm -f wsdisplay-draw wsdisplay-fbinfo wskbd-map wskbd-trivial

wsdisplay-draw: wsdisplay-draw.c
	cc -Wall -Werror -O2 -o $@ $<

wsdisplay-fbinfo: wsdisplay-fbinfo.c
	cc -Wall -Werror -O0 -g -o $@ $<

wskbd-map: wskbd-map.c
	cc -Wall -Werror -o $@ $<

wskbd-trivial: wskbd-trivial.c
	cc -Wall -Werror -o $@ $<
