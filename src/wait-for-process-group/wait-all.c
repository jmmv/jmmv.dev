#include <err.h>
#include <errno.h>
#include <stdlib.h>
#include <unistd.h>

// Convenience macro to abort quickly if a syscall fails with -1.
//
// Not great error handling, but better have some than none given that you, the
// reader, might be copy/pasting this into real production code.
#define CHECK_OK(call) if (call == -1) err(EXIT_FAILURE, #call);

int main(int argc, char** argv) {
    if (argc < 2) {
        errx(EXIT_FAILURE, "Must provide a program name and arguments");
    }

    int fds[2];
    CHECK_OK(pipe(fds));
    pid_t pid;
    CHECK_OK((pid = fork()));

    if (pid == 0) {
        // Enter a new process group for all of our descendents.
        CHECK_OK(setpgid(getpid(), getpid()));

        // Tell the parent that we have successfully created the group.
        CHECK_OK(close(fds[0]));
        CHECK_OK(write(fds[1], "\0", sizeof(char)));
        CHECK_OK(close(fds[1]));

        // Execute the given program now that the environment is ready.
        execv(argv[1], argv + 1);
        err(EXIT_FAILURE, "execv");
    }

    // Wait until the child has created its own process group.
    //
    // This is a must to prevent a race between the parent waiting for the
    // group and the group not existing yet, and is the only safe way to do so.
    CHECK_OK(close(fds[1]));
    char dummy;
    CHECK_OK(read(fds[0], &dummy, sizeof(char)));
    CHECK_OK(close(fds[0]));

    // Wait for the direct child to finish.  We do this separately to collect
    // and propagate its exit status.
    int status;
    CHECK_OK(waitpid(pid, &status, 0));

    // And now wait for any other process in the group to terminate, as the
    // documentation claims.
    while (waitpid(-pid, NULL, 0) != -1) {
        // Got a child.  Wait for more.
    }
    assert(errno == ECHILD);

    return WIFEXITED(status) ? WEXITSTATUS(status) : EXIT_FAILURE;
}
