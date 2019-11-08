#include <sys/types.h>
#include <sys/wait.h>
#if defined(WITH_SUBREAPER)
#include <sys/prctl.h>
#endif

#include <err.h>
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <unistd.h>

int main(int argc, char** argv) {
    if (argc < 2) {
        errx(EXIT_FAILURE, "Must provide a program name and arguments");
    }

#if defined(WITH_SUBREAPER)
    if (prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0) == -1) {
        err(EXIT_FAILURE, "prctl");
    }
#endif

    int fds[2];
    pipe(fds);

    pid_t pid = fork();
    if (pid == -1) {
        err(EXIT_FAILURE, "fork");
    } else if (pid == 0) {
        if (setpgid(getpid(), getpid()) == -1) {
            err(EXIT_FAILURE, "setpgid");
        }
        close(fds[0]);
        write(fds[1], 0, 1);
        close(fds[1]);
        execv(argv[1], argv + 1);
        err(EXIT_FAILURE, "execv");
    }

    // Arbitrary amount of time to let the child spawn its own subprocess.
    // This is obviously error-prone but suffices for this example.
    //sleep(1);

    close(fds[1]);
    char dummy;
    read(fds[0], &dummy, 1);

    //kill(-pid, SIGTERM);
    while (waitpid(-pid, NULL, 0) != -1) {
        // Got a child.  Wait for more.
    }
    if (errno != ECHILD) {
        err(EXIT_FAILURE, "waitpid");
    }
    printf("No children left\n");
    return EXIT_SUCCESS;
}
