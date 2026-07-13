// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[derive(serde::Deserialize, Debug)]
pub struct Request {
    url: String,
    // #[serde(rename = "type")] this is meta data for our obj, like in GO
    request_type: String,
    accept_invalid_certs: bool,
    headers: Vec<(String, String)>,
    body: Vec<(String, String)>,
    body_type: String,             // "json" | "form" | "raw" | "multipart" | "none"
    raw_body: Option<String>,      // used when body_type == "raw"
    files: Option<Vec<FileField>>, // used when body_type == "multipart"
    connection_timeout_ms: Option<u64>, // optional timeout for handshake in milliseconds
    timeout_ms: Option<u64>,       // optional timeout in milliseconds
}

#[derive(serde::Deserialize, Debug)]
pub struct FileField {
    field_name: String,
    file_name: String,
    mime_type: String,
    // base64-encoded bytes from the frontend, since JSON can't carry raw binary
    data_base64: String,
}

use base64::{engine::general_purpose, Engine as _};
use std::time::Duration;

#[tauri::command]
async fn process_request(request: Request) -> Result<String, String> {
    let mut builder = reqwest::Client::builder()
        .connect_timeout(Duration::from_millis(
            request.connection_timeout_ms.unwrap_or(10_000),
        ))
        .timeout(Duration::from_millis(request.timeout_ms.unwrap_or(30_000)));

    if request.accept_invalid_certs {
        builder = builder.danger_accept_invalid_certs(true);
    }

    let client = builder.build().map_err(|e| e.to_string())?;

    let mut req_builder = match request.request_type.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        "PATCH" => client.patch(&request.url),
        other => return Err(format!("Unsupported method: {}", other)),
    };

    for (key, value) in &request.headers {
        req_builder = req_builder.header(key, value);
    }

    req_builder = match request.body_type.as_str() {
        "json" => {
            let map: std::collections::HashMap<String, String> =
                request.body.clone().into_iter().collect();
            req_builder.json(&map)
        }
        "form" => req_builder.form(&request.body),
        "raw" => {
            let raw = request.raw_body.clone().unwrap_or_default();
            req_builder.body(raw)
        }
        "multipart" => {
            let mut form = reqwest::multipart::Form::new();

            // regular text fields
            for (key, value) in &request.body {
                form = form.text(key.clone(), value.clone());
            }

            // file fields
            if let Some(files) = &request.files {
                for f in files {
                    let bytes = general_purpose::STANDARD
                        .decode(&f.data_base64)
                        .map_err(|e| format!("Invalid base64 for {}: {}", f.file_name, e))?;

                    let part = reqwest::multipart::Part::bytes(bytes)
                        .file_name(f.file_name.clone())
                        .mime_str(&f.mime_type)
                        .map_err(|e| format!("Invalid mime type: {}", e))?;

                    form = form.part(f.field_name.clone(), part);
                }
            }

            req_builder.multipart(form)
        }
        "none" | _ => req_builder, // GET/DELETE, or unrecognized type: send no body
    };

    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {:#?}", e))?;

    let status = response.status();
    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status, text));
    }

    Ok(text)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_libsql::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, process_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
