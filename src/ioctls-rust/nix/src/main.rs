use std::ffi::c_uint;
use std::io;
use std::mem;
use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};

use nix::fcntl;
use nix::ioctl_read;
use nix::sys::stat;

#[repr(C)]
#[derive(Debug)]
#[allow(unused)]
struct WsDisplayFbInfo {
    height: c_uint,
    width: c_uint,
    depth: c_uint,
    cmsize: c_uint,
}

ioctl_read!(wsdisplayio_ginfo, b'W', 65, WsDisplayFbInfo);

fn main() -> io::Result<()> {
    let mut oflag = fcntl::OFlag::empty();
    oflag.insert(fcntl::OFlag::O_RDWR);
    oflag.insert(fcntl::OFlag::O_NONBLOCK);
    oflag.insert(fcntl::OFlag::O_EXCL);

    let fd = {
        let raw =
            fcntl::open("/dev/ttyE0", oflag, stat::Mode::empty())?;
        unsafe { OwnedFd::from_raw_fd(raw) }
    };

    let mut fbi: WsDisplayFbInfo;
    unsafe {
        fbi = mem::zeroed();
        wsdisplayio_ginfo(fd.as_raw_fd(), &mut fbi).unwrap();
    }
    eprintln!("fbinfo: {:?}", fbi);

    Ok(())
}
