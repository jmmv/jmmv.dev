use getoptsargs::prelude::*;

fn app_setup(builder: Builder) -> Builder {
    builder
        .copyright("Copyright 2026 Julio Merino")
        .bugs("https://example.com/hello/issues/")
        .homepage("https://hello.example.com/")
        .manpage("hello", "1")
        .optflag("y", "yell", "yell in uppercase")
        .trailarg("name", 1, usize::MAX, "names of the people to say hello to")
}

fn app_main(matches: Matches) -> Result<i32> {
    let mut message = format!("Hello, {}!", matches.arg_trail().join(", "));
    if matches.opt_present("yell") {
        message = message.to_ascii_uppercase();
    }
    println!("{}", message);
    Ok(0)
}

app!("Hello", app_setup, app_main);
