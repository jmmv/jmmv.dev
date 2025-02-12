fn main() {
    if cfg!(target_os = "netbsd") {
        println!("cargo::rerun-if-changed=src/ffi.c");
        cc::Build::new().file("src/ffi.c").compile("ffi");
    } else {
        println!("cargo::rerun-if-changed=src/dummy.c");
        cc::Build::new().file("src/dummy.c").compile("ffi");
    }
}
