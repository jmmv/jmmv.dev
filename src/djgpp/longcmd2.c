#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char** argv) {
    int i;
    int total;

    total = 0;
    for (i = 0; i < argc; i++) {
        if (i > 0) {
            total += 1;  // Assume 1 space between arguments.
        }
        total += strlen(argv[i]);
    }
    printf("argc after re-exec: %d\n", argc);
    printf("textual length: %d\n", total);

    return EXIT_SUCCESS;
}
