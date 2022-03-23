mod handlers;
use clap::Parser;
// use openssl::ssl::{SslAcceptor, SslMethod};
use std::io::Error;
use std::net::TcpListener;
use std::sync::Arc;

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
  /// Address to bind to
  #[clap(short, long, default_value = "localhost")]
  address: String,

  /// Port to bind to
  #[clap(short, long, default_value_t = 8080)]
  port: u16,

  /// Target directory to serve
  #[clap(short, long, default_value = "docroot")]
  target_dir: String,
}

fn main() -> Result<(), Error> {
  let args = Args::parse();
  let address = format!("{}:{}", args.address, args.port);
  let listener = TcpListener::bind(&address)?;
  println!("Listening on http://{}", address);
  let target_dir = Arc::new(args.target_dir);
  loop {
    if let Ok((stream, _addr)) = listener.accept() {
      let target_dir = Arc::clone(&target_dir);
      std::thread::spawn(move || {
        handlers::handle_request(stream, &*target_dir);
      });
    }
  }
  //   let sslbuilder = SslAcceptor::mozilla_intermediate_v5(SslMethod::tls()).unwrap();
  //   let sslacceptor = sslbuilder.build();
  //   for stream in listener.incoming() {
  //     if let Ok(stream) = stream {
  //       match sslacceptor.accept(stream) {
  //         Ok(sslstream) => {
  //           let target_dir = Arc::clone(&target_dir);
  //           std::thread::spawn(move || {
  //             handlers::handle_request(sslstream, &*target_dir);
  //           });
  //         }
  //         Err(why) => println!("Ssl error: {}", why),
  //       }
  //     }
  //   }
  //   Ok(())
}
