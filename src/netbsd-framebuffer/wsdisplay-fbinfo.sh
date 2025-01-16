gdb -q \
    -ex 'set print pretty on' \
    -ex 'break exit' \
    -ex 'run' \
    -ex 'frame 1' \
    -ex 'print fbinfo' \
    -ex 'cont' \
    -ex 'quit' \
    ./wsdisplay-fbinfo
