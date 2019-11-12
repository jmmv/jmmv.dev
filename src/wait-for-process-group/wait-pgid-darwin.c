#include <sys/types.h>
#include <sys/sysctl.h>

#include <assert.h>
#include <errno.h>
#include <stdlib.h>

// Waits for a process group to terminate.  Assumes that the process leader
// still exists in the process table (though it may be a zombie).
//
// May never converge if the processes in the group are still spawning their
// own subprocesses.
int wait_for_process_group(pid_t pgid) {
    int name[] = {CTL_KERN, KERN_PROC, KERN_PROC_PGRP, pgid};

    for (;;) {
        // Query the list of processes in the group by using sysctl(3).
        // This is "hard" because we don't know how big that list is, so we
        // have to first query the size of the output data and then account for
        // the fact that the size might change by the time we actually issue
        // the query.
        struct kinfo_proc *procs = NULL;
        size_t nprocs = 0;
        do {
            size_t len;
            if (sysctl(name, 4, 0, &len, NULL, 0) == -1) {
                return -1;
            }
            procs = (struct kinfo_proc *)malloc(len);
            if (sysctl(name, 4, procs, &len, NULL, 0) == -1) {
                assert(errno == ENOMEM);
                free(procs);
                procs = NULL;
            } else {
                nprocs = len / sizeof(struct kinfo_proc);
            }
        } while (procs == NULL);
        assert(nprocs >= 1);  // Must have found the group leader at least.

        if (nprocs == 1) {
            // Found only one process, which must be the leader because we have
            // purposely expect it as a zombie.
            assert(procs->kp_proc.p_pid == pgid);
            free(procs);
            return 0;
        }

        // More than one process left in the process group.  Pause a little bit
        // before retrying to avoid burning CPU.
        struct timespec ts;
        ts.tv_sec = 0;
        ts.tv_nsec = 1000000;
        if (nanosleep(&ts, NULL) == -1) {
            return -1;
        }
    }
}
