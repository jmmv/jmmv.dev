#include <sys/param.h>
#include <sys/types.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
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

    // Ensure the framebuffer aligns with the expectations of our demo
    // code below.
    if (fbinfo.fbi_bitsperpixel != 32)
        errx(1, "bitsperpixel not supported by this demo");
    if (fbinfo.fbi_pixeltype != WSFB_RGB)
        errx(1, "pixeltype not supported by this demo");

    // Configure the wsdisplay to enter "dumb framebuffer" mode.
    unsigned int mode = WSDISPLAYIO_MODE_DUMBFB;
    if (ioctl(fd, WSDISPLAYIO_SMODE, &mode) == -1)
        err(1, "ioctl failed");

    // Map the framebuffer memory.  Must come after the SMODE ioctl.
    uint32_t *ptr = (uint32_t*)mmap(
        0, fbinfo.fbi_fbsize, PROT_READ | PROT_WRITE, MAP_SHARED,
        fd, fbinfo.fbi_fboffset);
    if (ptr == MAP_FAILED)
        err(1, "mmap failed");

    // Fill the screen multiple times with pixels of different
    // colors to render a simple animation.
    size_t pixels = fbinfo.fbi_fbsize / sizeof(uint32_t);
    int off = 0;
    for (int i = 0; i < 100; i++) {
        int r = off; int g = off; int b = off;
        for (size_t i = 0; i < pixels; i++) {
            r = (r + 1) % 255; g = (g + 2) % 255; b = (b + 3) % 255;
            ptr[i] = 0
                | (r << fbinfo.fbi_subtype.fbi_rgbmasks.red_offset)
                | (g << fbinfo.fbi_subtype.fbi_rgbmasks.green_offset)
                | (b << fbinfo.fbi_subtype.fbi_rgbmasks.blue_offset);
        }
        off += 10;
        usleep(1);
    }

    // Configure the wsdisplay to enter "console emulation" mode.
    // In other words: return to the console.
    mode = WSDISPLAYIO_MODE_EMUL;
    if (ioctl(fd, WSDISPLAYIO_SMODE, &mode) == -1) {
        err(1, "ioctl failed");
    }

    close(fd);
    return EXIT_SUCCESS;
}
