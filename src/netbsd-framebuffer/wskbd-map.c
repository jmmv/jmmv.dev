#include <sys/param.h>
#include <sys/types.h>
#include <sys/ioctl.h>
#include <dev/wscons/wsconsio.h>
#include <dev/wscons/wsksymdef.h>

#include <err.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char** argv) {
    // Open the main wskbd device.
    int fd = open("/dev/wskbd0", O_RDONLY);
    if (fd == -1)
        err(1, "open failed");

    // Allocate space for the biggest possible keymap.
    struct wscons_keymap map[WSKBDIO_MAXMAPLEN];
    memset(map, 0, sizeof(struct wscons_keymap) * WSKBDIO_MAXMAPLEN);

    // Get the keymap from the device.
    struct wskbd_map_data data;
    data.maplen = WSKBDIO_MAXMAPLEN;
    data.map = map;
    if (ioctl(fd, WSKBDIO_GETMAP, &data) == -1)
        err(1, "ioctl failed");

    // Dump keymap entries.
    printf("Keymap length: %u entries\n", data.maplen);
    for (size_t i = 0; i < data.maplen; i++) {
        // Skip printing entries that are not for letters.
        if (map[i].command != KS_voidSymbol)
            continue;
        char normal = map[i].group1[0];
        char shifted = map[i].group1[1];
        if (normal < 'a' || normal > 'z')
            continue;

        printf("Keycode %zd: '%c', '%c'\n", i, normal, shifted);
    }

    close(fd);
    return EXIT_SUCCESS;
}
