use std::ffi::{c_char, c_uint};
use std::io;
use std::mem;
use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};

/**
 ioccom.h contains definition of _IOR

#include <dev/wscons/wsconsio.h>
#include <stdio.h>

int main(void) {
    printf("%x\n", WSDISPLAYIO_GINFO);
}
 */
const WSDISPLAYIO_GINFO: u64 = 0x40105741;

#[repr(C)]
#[derive(Debug)]
#[allow(unused)]
struct WsDisplayFbInfo {
    height: c_uint,
    width: c_uint,
    depth: c_uint,
    cmsize: c_uint,
}

fn main() -> io::Result<()> {
    let fd = {
        let result = unsafe {
            libc::open(
                "/dev/ttyE0\0".as_ptr() as *const c_char,
                libc::O_RDWR | libc::O_NONBLOCK | libc::O_EXCL,
                0,
            )
        };
        if result == -1 {
            return Err(io::Error::last_os_error());
        }
        unsafe { OwnedFd::from_raw_fd(result) }
    };

    let mut fbi: WsDisplayFbInfo;
    unsafe {
        fbi = mem::zeroed();
        let result = libc::ioctl(
            fd.as_raw_fd(),
            WSDISPLAYIO_GINFO,
            &mut fbi as *mut WsDisplayFbInfo,
        );
        if result == -1 {
            return Err(io::Error::last_os_error());
        }
    }
    eprintln!("fbinfo: {:?}", fbi);

    Ok(())
}
