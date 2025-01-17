#include <sys/param.h>
#include <sys/types.h>
#include <sys/ioctl.h>
#include <dev/wscons/wsconsio.h>

#include <err.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, char** argv) {
    // Open the main wskbd device.
    int fd = open("/dev/wskbd0", O_RDONLY);
    if (fd == -1)
        err(1, "open failed");

    // Wait for one key down press only.
    for (;;) {
        struct wscons_event ev;
        int ret = read(fd, &ev, sizeof(ev));
        if (ret == -1)
            err(1, "read failed");

        if (ev.type == WSCONS_EVENT_KEY_DOWN) {
            printf("value: %d, char '%c'\n", ev.value, (char)ev.value);
            break;
        }
    }

    close(fd);
    return EXIT_SUCCESS;
}
