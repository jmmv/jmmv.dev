#include <sys/param.h>
#include <sys/types.h>
#include <sys/ioctl.h>
#include <dev/wscons/wsconsio.h>

#include <err.h>
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    // Open the main wsdisplay device.
    int fd = open("/dev/ttyE0", O_RDWR | O_NONBLOCK | O_EXCL);
    if (fd == -1)
        err(1, "open failed");

    // Query information about the framebuffer.
    struct wsdisplayio_fbinfo fbinfo;
    if (ioctl(fd, WSDISPLAYIO_GET_FBINFO, &fbinfo) == -1)
        err(1, "ioctl failed");

    close(fd);
    exit(EXIT_SUCCESS);
}
