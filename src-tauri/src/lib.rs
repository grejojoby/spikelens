use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

struct SidecarState(Mutex<Option<CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState(Mutex::new(None)))
        .setup(|app| {
            // Spawn the Go backend sidecar
            let sidecar_result = app
                .shell()
                .sidecar("spikelens-server")
                .map(|cmd| cmd.spawn());

            match sidecar_result {
                Ok(Ok((_, child))) => {
                    let state: State<SidecarState> = app.state();
                    *state.0.lock().unwrap() = Some(child);
                    log::info!("SpikeLens backend started on :7777");
                }
                Ok(Err(e)) => {
                    log::warn!("Failed to spawn sidecar: {}. Backend must be running externally.", e);
                }
                Err(e) => {
                    log::warn!("Sidecar not found: {}. Backend must be running externally.", e);
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Take the child out of the mutex in its own scope so the
                // MutexGuard is dropped before `state` is dropped.
                let state: State<SidecarState> = window.state();
                let child = { state.0.lock().unwrap().take() };
                if let Some(child) = child {
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
