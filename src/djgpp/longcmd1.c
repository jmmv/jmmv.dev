#ifdef __GNUC__
#include <unistd.h>
#else
#include <process.h>
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char** argv) {
    char** longcmd;
    int i;

    // Generate a command line that exceeds DOS' limits.
    longcmd = (char**)malloc(32);
    longcmd[0] = argv[0];
    for (i = 1; i < 31; i++) {
        longcmd[i] = strdup("one-argument");
    }
    longcmd[i] = NULL;

    // Execute the second stage of this demo to print the received
    // command line.
    if (execv(".\\longcmd2.exe", longcmd) == -1) {
        perror("execv failed");
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
