#include <stdio.h>
#include <stdlib.h>

int main(void) {
    printf("PATH = %s\n", getenv("PATH"));
    return EXIT_SUCCESS;
}
