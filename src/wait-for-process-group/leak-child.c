#include <sys/types.h>
#include <sys/wait.h>

#include <err.h>
#include <errno.h>
#include <inttypes.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <unistd.h>

volatile bool caught = false;

void handler(int signo) {
    caught = true;
}

int child(void) {
    while (!caught) {
        sleep(1);
    }
    printf("Signal caught by child %" PRIdMAX "; exiting\n",
           (intmax_t) getpid());
    // Artificial delay.
    sleep(5);
    printf("Child exiting, parent is %d\n", getppid());
    return EXIT_SUCCESS;
}

int parent(pid_t pid) {
    printf("Parent %u, group %u\n", getpid(), getpgrp());
//    if (waitpid(pid, NULL, 0) == -1 && errno != EINTR) {
//        err(EXIT_FAILURE, "waitpid");
//    }
    if (caught) {
        printf("Signal caught by parent %" PRIdMAX "\n",
               (intmax_t) getpid());
    }

    printf("Parent exiting\n");
    return EXIT_SUCCESS;
}

int main(void) {
    struct sigaction sa;
    sa.sa_handler = handler;
    sa.sa_flags = 0;
    sigemptyset(&sa.sa_mask);
    if (sigaction(SIGTERM, &sa, 0) == -1) {
        err(EXIT_FAILURE, "sigaction");
    }

    pid_t pid = fork();
    if (pid == -1) {
        err(EXIT_FAILURE, "fork");
    } else if (pid == 0) {
        return child();
    } else {
        return parent(pid);
    }
}
