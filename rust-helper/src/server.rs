//! Localhost WebSocket server (I1). Node connects here as a client.
//!
//!   Helper -> Node : BINARY = encoded frames (fed by the capture task, Phase 2).
//!   Node   -> Helper: TEXT  = JSON `InputCommand`s (dispatched to enigo, Phase 4).
//!
//! Bound to 127.0.0.1 only — it is never exposed to the network; the phone talks
//! to Node on :5000, Node relays to here. Multiple Node reconnects are fine: each
//! connection subscribes to the shared frame broadcast.

use std::net::SocketAddr;

use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tokio_tungstenite::tungstenite::Message;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::protocol::{HelperEvent, InputCommand};

/// Shared handle wiring the capture task (frame producer) to connected clients,
/// and routing input commands back out to the input task.
#[derive(Clone)]
pub struct Hub {
    /// Encoded frames fan out to every connected Node client.
    pub frames_tx: broadcast::Sender<Vec<u8>>,
    /// Input commands received from Node, fan out to the input executor.
    pub input_tx: broadcast::Sender<InputCommand>,
    /// When true the capture loop emits H.264 instead of JPEG (phone opt-in).
    pub h264: Arc<AtomicBool>,
    /// Capture geometry, reported in the Hello event.
    pub width: u32,
    pub height: u32,
    pub monitor: usize,
    /// Shared authentication secret passed via environment variable.
    pub secret: String,
}

impl Hub {
    pub fn new() -> Self {
        // Frames: bounded so a stalled client drops old frames rather than
        // blocking capture (lag is preferable to backpressure on the encoder).
        let (frames_tx, _) = broadcast::channel(8);
        let (input_tx, _) = broadcast::channel(256);
        Self {
            frames_tx,
            input_tx,
            h264: Arc::new(AtomicBool::new(false)),
            width: 0,
            height: 0,
            monitor: 0,
            secret: String::new(),
        }
    }
}

/// Accept loop. Binds to `addr` (127.0.0.1:<port>) and serves each Node client.
pub async fn run(addr: SocketAddr, hub: Hub) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    log::info!("helper WS listening on ws://{addr}");
    loop {
        let (stream, peer) = listener.accept().await?;
        let hub = hub.clone();
        tokio::spawn(async move {
            if let Err(e) = serve_client(stream, hub).await {
                log::debug!("client {peer} ended: {e}");
            }
        });
    }
}

async fn serve_client(stream: TcpStream, hub: Hub) -> anyhow_lite::Result {
    let ws = tokio_tungstenite::accept_async(stream)
        .await
        .map_err(|e| e.to_string())?;
    let (mut sink, mut source) = ws.split();

    // Authenticate first message presenting secret in constant-time
    let auth_msg = match source.next().await {
        Some(Ok(Message::Text(txt))) => {
            if txt.len() > 65536 {
                return Err("Auth frame exceeded 64KB limit".to_string());
            }
            serde_json::from_str::<InputCommand>(&txt).map_err(|e| e.to_string())?
        }
        _ => return Err("Connection closed before auth handshake".to_string()),
    };

    match auth_msg {
        InputCommand::Auth { secret } => {
            if !constant_time_eq(secret.as_bytes(), hub.secret.as_bytes()) {
                log::warn!("Unauthorized helper connection attempt rejected: secret mismatch");
                return Err("Unauthorized".to_string());
            }
        }
        _ => {
            log::warn!("First helper frame was not an Auth command");
            return Err("Expected Auth handshake command".to_string());
        }
    }

    log::info!("Node successfully authenticated with desktop-helper");

    // Greet with capture geometry + pairing state (pairing fills in Phase 6).
    let hello = HelperEvent::Hello {
        width: hub.width,
        height: hub.height,
        monitor: hub.monitor,
        pairing_code: None,
    };
    let hello = serde_json::to_string(&hello).map_err(|e| e.to_string())?;
    sink.send(Message::Text(hello)).await.map_err(|e| e.to_string())?;

    let mut frames = hub.frames_tx.subscribe();
    let mut last_seq = 0u64;

    loop {
        tokio::select! {
            // Outbound: encoded frames -> Node as binary.
            frame = frames.recv() => match frame {
                Ok(bytes) => {
                    if sink.send(Message::Binary(bytes)).await.is_err() {
                        break;
                    }
                }
                // Lagged: client too slow, skipped frames — keep going with the latest.
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    log::debug!("client lagged, dropped {n} frames");
                }
                Err(broadcast::error::RecvError::Closed) => break,
            },
            // Inbound: JSON input commands from Node.
            msg = source.next() => match msg {
                Some(Ok(Message::Text(txt))) => {
                    // Maximum payload size limit per Section 5.5: 64KB (65536 bytes)
                    if txt.len() > 65536 {
                        log::warn!("Payload exceeded 64KB limit, dropping client");
                        break;
                    }

                    match serde_json::from_str::<InputCommand>(&txt) {
                        Ok(cmd) => {
                            // Enforce monotonic sequence numbers: reject seq <= last_seq (replay attack)
                            if let Some(seq) = cmd.seq() {
                                if seq <= last_seq {
                                    log::warn!("Replay detected: sequence {seq} <= last {last_seq}");
                                    break;
                                }
                                last_seq = seq;
                            }

                            // Video is a stream-control command — toggle the encoder
                            // flag here instead of routing it to the input executor.
                            match cmd {
                                InputCommand::Video { codec, .. } => {
                                    hub.h264.store(codec == "h264", Ordering::Relaxed);
                                    log::info!("video codec set to {codec}");
                                }
                                InputCommand::Auth { .. } => {}
                                other => { let _ = hub.input_tx.send(other); }
                            }
                        }
                        Err(e) => log::warn!("bad input command: {e}: {txt}"),
                    }
                }
                Some(Ok(Message::Close(_))) | None => break,
                Some(Ok(_)) => {} // ignore binary/ping from Node
                Some(Err(e)) => { log::debug!("ws error: {e}"); break; }
            },
        }
    }
    log::info!("Node disconnected from helper");
    Ok(())
}

/// Constant-time slice comparison preventing timing side-channel attacks
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

/// Tiny local error alias so we don't pull in the full `anyhow` crate yet.
mod anyhow_lite {
    pub type Result = std::result::Result<(), String>;
}
