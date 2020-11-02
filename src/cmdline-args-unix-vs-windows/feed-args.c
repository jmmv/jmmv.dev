#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    char* argv[] = {
        "fake-name"   // The (fake!) program name.
        "one",        // An argument with a single word.
        "two three",  // An argument with multiple words.
        "p*",         // An argument with a glob that matches print-args.
        NULL,
    };
    execv("./print-args", argv);
    perror("execv failed");
    return EXIT_FAILURE;
}
