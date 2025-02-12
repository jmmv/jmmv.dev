#include <dev/wscons/wsconsio.h>
#include <sys/ioctl.h>

struct my_ginfo {
    unsigned int height;
    unsigned int width;
    unsigned int depth;
};

int get_ginfo(int fd, struct my_ginfo* gi) {
    struct wsdisplay_fbinfo fbi;

    int result = ioctl(fd, WSDISPLAYIO_GINFO, &fbi);
    if (result == -1) {
        return result;
    }

    gi->height = fbi.height;
    gi->width = fbi.width;
    gi->depth = fbi.depth;

    return 0;
}
