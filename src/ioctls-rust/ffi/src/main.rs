use std::ffi::{c_char, c_int, c_uint};
use std::io;
use std::mem;
use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};

#[repr(C)]
#[derive(Debug)]
#[allow(unused)]
struct MyGInfo {
    height: c_uint,
    width: c_uint,
    depth: c_uint,
}

extern "C" {
    fn get_ginfo(fd: c_int, gi: *mut MyGInfo) -> c_int;
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

    let mut gi: MyGInfo;
    unsafe {
        gi = mem::zeroed();
        let result = get_ginfo(fd.as_raw_fd(), &mut gi as *mut MyGInfo);
        if result == -1 {
            return Err(io::Error::last_os_error());
        }
    }
    eprintln!("my_ginfo: {:?}", gi);

    Ok(())
}
