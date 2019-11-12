#include <sys/types.h>
#include <sys/event.h>

#include <assert.h>
#include <stddef.h>
#include <unistd.h>

// Waits for a process to terminate but does *not* collect its exit status,
// thus leaving the process as a zombie.
//
// According to the kqueue(2) documentation (and I confirmed it experimentally),
// registering for an event reports any pending such events, so this is not racy
// if the process happened to exit before we got to installing the kevent.
int wait_for_process(pid_t pid) {
    int kq;
    if ((kq = kqueue()) == -1) {
        return -1;
    }

    struct kevent kc;
    EV_SET(&kc, pid, EVFILT_PROC, EV_ADD | EV_ENABLE, NOTE_EXIT, 0, 0);

    int nev;
    struct kevent ke;
    if ((nev = kevent(kq, &kc, 1, &ke, 1, NULL)) == -1) {
        return -1;
    }
    assert(nev == 1);
    assert(ke.ident == pid);
    assert(ke.fflags & NOTE_EXIT);

    return close(kq);
}
