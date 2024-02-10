#include <fcntl.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#define BUFMINBASE  2 * 1024 * 1024
#define BUFSIZE     1 * 1024 * 1024

int main(void) {
    // Allocate a buffer until its base address is past the 2MB boundary.
    char* buf = NULL;
    while (buf < (char*)(BUFMINBASE))
        buf = (char*)malloc(BUFSIZE);
    printf("Read buffer base is at %zd KB\n", ((intptr_t)buf) / 1024);

    // Open this source file and print its first line.  Really unsafe.
    int fd = open("headself.c", O_RDONLY);
    read(fd, buf, BUFSIZE);
    char *ptr = buf; while (*ptr != '\n') ptr++; *(ptr + 1) = '\0';
    printf("%s", buf);

    return EXIT_SUCCESS;
}
