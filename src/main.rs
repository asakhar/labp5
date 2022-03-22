use std::collections::HashMap;
use std::fs::metadata;
use std::fs::read_to_string;
use std::io::{Error, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;

fn get_request(request: &str) -> Option<(&str, &str, &str, &str)> {
    let mut req_lines = request.lines();
    let mut parts = req_lines.next().unwrap().split_whitespace();
    let method = parts.next().ok_or("Method not specified").unwrap();
    // We only accept GET requests
    if method != "GET" {
        println!("Unsupported method: {}", method);
        return None;
    }

    let uri_string = Path::new(parts.next().ok_or("URI not specified").unwrap());
    let uri_string = uri_string.to_str().expect("Invalid unicode!");
    let mut uri_query = uri_string.splitn(2, '?');
    let uri = uri_query.next().unwrap();
    let query = uri_query.next().unwrap_or_default();

    let http_version = parts.next().ok_or("HTTP version not specified").unwrap();
    if http_version != "HTTP/1.1" {
        println!("Unsupported HTTP version: {}, use HTTP/1.1", http_version);
        return None;
    }
    Some((method, uri, query, http_version))
}

fn handle_request(mut stream: TcpStream) {
    let mut buffer = [0; 1024];

    stream.read(&mut buffer).unwrap();

    let request = String::from_utf8_lossy(&buffer[..]);
    let (_, mut uri, query, _) = match get_request(&request) {
        Some(res) => res,
        None => return,
    };
    if uri == "/" {
        uri = "/index.html";
    }
    // println!("URI: {}\nQuery: {}", uri, query);
    let cwd_pathb = std::env::current_dir().unwrap();
    let cwd = cwd_pathb.to_str().unwrap();
    let path_str = format!("{}/docroot{}", cwd, uri);
    let file_path = Path::new(&path_str);
    if !file_path.exists() {
        stream.write(b"HTTP/1.1 404 NOT FOUND\r\n\r\n").unwrap();
        return;
    }
    let file_metadata = metadata(file_path).unwrap();
    let time = file_metadata
        .modified()
        .unwrap()
        .duration_since(file_metadata.created().unwrap())
        .unwrap()
        .as_secs();
    let mut query_map = HashMap::new();
    query
        .split('&')
        .map(|part| {
            let mut kv = part.split('=');
            let k = kv.next().unwrap();
            let v = kv.next().unwrap_or("true");
            query_map.insert(k, v);
        })
        .count();
    // println!("{:?}", query_map);
    if query_map.contains_key("refresh") {
        if let Some(prev) = query_map.get("previous_modified") {
            if u64::from_str_radix(prev, 10).unwrap_or_default() != time {
                let contents = "###reftrue###";
                let response = format!("HTTP/1.1 200 OK\r\n\r\n{}", contents);

                stream.write(response.as_bytes()).unwrap();
                stream.flush().unwrap();
                // println!("Reloaded");
                return;
            }
        }
    }
    let mut script_tags = ("", "");
    if uri.ends_with("html") {
        script_tags = ("<script>", "</script>");
    }
    let reload_script = format!(
        "\n{}
    function reloadhandler() {{
      let filename = '{}';
      var prevmods = document.querySelectorAll(\"input.previous_modified\");
      let prevmod;
      for (let cand of prevmods) {{
          if (cand.getAttribute('id') == filename) {{
              prevmod = cand.value;
              break;
          }}
      }}
      fetch(filename+\"?refresh&previous_modified=\"+prevmod).then(resp => {{
        return resp.text();
      }}).then(resp => {{
        if (resp == '###reftrue###')
          document.location.reload();
      }});
    }}
    setInterval(reloadhandler, 2000);
    elem = document.createElement('input');
    elem.setAttribute('type', 'hidden');
    elem.setAttribute('value', '{}');
    elem.setAttribute('class', 'previous_modified');
    elem.setAttribute('id', '{}');
    document.getElementsByTagName('body')[0].appendChild(elem);
  {}",
        script_tags.0, uri, time, uri, script_tags.1
    );

    let contents = read_to_string(file_path).unwrap() + &reload_script;
    let response = format!("HTTP/1.1 200 OK\r\n\r\n{}", contents);

    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}

fn main() -> Result<(), Error> {
    let addr = "192.168.88.41:8080";
    let listener = TcpListener::bind(addr)?;
    println!("Listening on http://{}", addr);

    for stream in listener.incoming() {
        handle_request(stream?);
    }
    Ok(())
}
