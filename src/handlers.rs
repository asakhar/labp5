use std::collections::HashMap;
use std::fs::metadata;
use std::fs::read_to_string;
use std::io::BufRead;
use std::io::BufReader;
use std::io::{Read, Write};
use std::path::Path;

#[derive(Debug)]
#[allow(dead_code)]
struct Request {
  method: String,
  uri: String,
  query: HashMap<String, Vec<String>>,
  http_version: String,
  headers: HashMap<String, String>,
  content: Vec<u8>,
}

fn get_request<Stream: Read + Write>(stream: &mut Stream) -> Option<Request> {
  let mut reader = BufReader::new(stream);
  let mut request_head = String::new();
  match reader.read_line(&mut request_head) {
    Err(why) => {
      println!("Error reading line from stream: {}", why);
      return None;
    }
    Ok(res) => res,
  };

  let mut parts = request_head.split_whitespace();
  let method = match parts.next() {
    None => {
      println!("Method not specified");
      return None;
    }
    Some(res) => res,
  };
  // We only accept GET requests
  if method != "GET" && method != "POST" {
    println!("Unsupported method: {}", method);
    return None;
  }

  let uri_string = Path::new(match parts.next() {
    None => {
      println!("URI not specified");
      return None;
    }
    Some(res) => res,
  });
  let uri_string = match uri_string.to_str() {
    None => {
      println!("Invalid unicode!");
      return None;
    }
    Some(res) => res,
  };
  let mut uri_query = uri_string.splitn(2, '?');
  let uri = uri_query.next().unwrap();
  let query_list = uri_query.next().unwrap_or_default().split('&');
  let mut query = HashMap::new();

  for query_item in query_list {
    let mut parts = query_item.splitn(2, "=");
    let k = parts.next().unwrap();
    let v = parts.next().unwrap_or_default().to_string();
    if !query.contains_key(k) {
      query.insert(k.to_string(), Vec::new());
    }
    query.get_mut(k).unwrap().push(v);
  }

  let http_version = match parts.next() {
    None => {
      println!("HTTP version not specified");
      return None;
    }
    Some(res) => res,
  };
  if http_version != "HTTP/1.1" {
    println!("Unsupported HTTP version: {}, use HTTP/1.1", http_version);
    return None;
  }
  let mut headers = HashMap::new();
  let mut content = Vec::new();
  loop {
    let mut line = String::new();
    match reader.read_line(&mut line) {
      Err(why) => {
        println!("Error reading headers: {}", why);
        return None;
      }
      Ok(res) => res,
    };
    if line == "\r\n" {
      break;
    }
    let mut parts = line.splitn(2, ": ");
    let k = parts.next().unwrap().to_string();
    let v = parts.next().unwrap_or_default().trim_end().to_string();
    headers.insert(k, v);
  }
  if headers.contains_key("Content-Length") {
    let length: usize = match usize::from_str_radix(&headers["Content-Length"], 10) {
      Err(why) => {
        println!("Invalid content length: {}", why);
        return None;
      }
      Ok(res) => res,
    };
    content.resize(length, 0);
    if let Err(why) = reader.read_exact(&mut content) {
      println!("Error reading content from stream: {}", why);
      return None;
    }
  }

  Some(Request {
    method: method.to_string(),
    uri: uri.to_string(),
    query: query,
    http_version: http_version.to_string(),
    headers: headers,
    content: content,
  })
}

fn handle_refresh_request<Stream: Read + Write>(
  stream: &mut Stream,
  query: &HashMap<String, Vec<String>>,
  target_dir: &str,
) {
  // println!("{:?}", query_map);
  let mut contents = "";
  if query.iter().any(|(file, time_str)| {
    let time_recv = match u64::from_str_radix(&time_str[0], 10) {
      Err(why) => {
        println!("{}", why);
        return true;
      }
      Ok(res) => res,
    };
    let file_path = format!("{}{}", target_dir, file);
    let file_metadata = match metadata(&file_path) {
      Err(why) => {
        println!("{}", why);
        return true;
      }
      Ok(res) => res,
    };
    let time_real = file_metadata
      .modified()
      .unwrap()
      .duration_since(file_metadata.created().unwrap())
      .unwrap()
      .as_secs();
    if time_real != time_recv {
      println!("File '{}' changed. Refreshing...", file_path);
    }
    time_real != time_recv
  }) {
    contents = "###reftrue###";
  }
  stream
    .write(format!("HTTP/1.1 200 OK\r\n\r\n{}", contents).as_bytes())
    .unwrap();
  stream.flush().unwrap();
}

pub fn handle_request<Stream: Read + Write>(mut stream: Stream, target_dir: &str) {
  let request = match get_request(&mut stream) {
    Some(res) => res,
    None => return,
  };
  // println!("Got request:\n----------------------------------------\n{:?}\n----------------------------------------\n", request);
  let mut uri: &str = &request.uri;
  if uri == "/__refresh_request" {
    handle_refresh_request(&mut stream, &request.query, target_dir);
    return;
  }
  let tmpstr: String;
  if !uri.split('/').last().unwrap_or("/").contains('.') {
    tmpstr = format!("{}/index.html", uri);
    uri = &tmpstr;
  }
  // println!("URI: {}\nQuery: {}", uri, query);
  let path_str = format!("{}{}", target_dir, uri);
  let file_path = Path::new(&path_str);
  if !file_path.exists() {
    stream
      .write(b"HTTP/1.1 404 NOT FOUND\r\n\r\n")
      .unwrap_or_else(|why| {
        println!("Error writing to client: {}", why);
        0
      });
    return;
  }
  let file_metadata = metadata(file_path).unwrap();
  let time = file_metadata
    .modified()
    .unwrap()
    .duration_since(file_metadata.created().unwrap())
    .unwrap()
    .as_secs();

  let mut script_tags = ("", "");
  if !uri.ends_with("js") {
    script_tags = ("<script>", "</script>");
  }
  let reload_script = format!(
    "
{}
tmp = '{}={}';
if(!__filemodmap) {{
    var __filemodmap = tmp;
}} else {{
    __filemodmap += '&'+tmp;
}}
if(!__reloadhandler)
{{
    function __reloadhandler() {{
        let request = 
        fetch(\"/__refresh_request?\"+__filemodmap).then(resp => {{
            return resp.text();
        }}).then(resp => {{
            if (resp == '###reftrue###')
                document.location.reload();
        }});
    }}
    setInterval(__reloadhandler, 2000);
}}
{}
        ",
    script_tags.0, uri, time, script_tags.1
  );

  let contents = read_to_string(file_path).unwrap() + &reload_script;
  let response = format!("HTTP/1.1 200 OK\r\n\r\n{}", contents);

  stream.write(response.as_bytes()).unwrap();
  stream.flush().unwrap();
}
