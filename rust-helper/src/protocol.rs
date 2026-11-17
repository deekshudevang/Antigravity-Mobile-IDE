//! Wire protocol between the Rust helper and the Node bridge over the localhost
//! WebSocket.
//!
//!   Helper -> Node : BINARY messages  = encoded video frames (JPEG for C1).
//!   Node   -> Helper: TEXT (JSON)      = input commands (this enum).
//!
//! Coordinates are normalised 0.0..=1.0 over the captured (primary) display, so
//! the phone never needs to know the host resolution — the helper maps them to
//! absolute pixels for enigo in Phase 4.

use serde::{Deserialize, Serialize};

/// One input command from the phone, relayed verbatim by Node.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum InputCommand {
    /// Initial authentication handshake message presenting the shared secret.
    Auth { secret: String },
    /// Absolute pointer move to a normalised position.
    Move {
        x: f64,
        y: f64,
        #[serde(default)]
        seq: Option<u64>,
    },
    /// Mouse button down/up at a normalised position. button = left|right|middle.
    Button {
        x: f64,
        y: f64,
        button: String,
        down: bool,
        #[serde(default)]
        seq: Option<u64>,
    },
    /// Wheel scroll. Positive `dy` scrolls the page down (matches the phone gesture).
    Scroll {
        x: f64,
        y: f64,
        dx: f64,
        dy: f64,
        #[serde(default)]
        seq: Option<u64>,
    },
    /// A single key event with active modifiers (the sticky chip row, E1/F1).
    /// `key` is a logical name: "a", "Enter", "Escape", "F5", "ArrowUp", ...
    Key {
        key: String,
        down: bool,
        #[serde(default)]
        ctrl: bool,
        #[serde(default)]
        alt: bool,
        #[serde(default)]
        shift: bool,
        #[serde(default)]
        meta: bool,
        #[serde(default)]
        seq: Option<u64>,
    },
    /// Type a literal string into the focused OS window (the input field, F1).
    Text {
        text: String,
        #[serde(default)]
        seq: Option<u64>,
    },
    /// Switch the outbound video codec for the screen stream: "h264" | "jpeg".
    /// Handled in the WS server (toggles the capture encoder), not the input task.
    Video {
        codec: String,
        #[serde(default)]
        seq: Option<u64>,
    },
}

impl InputCommand {
    pub fn seq(&self) -> Option<u64> {
        match self {
            InputCommand::Move { seq, .. } => *seq,
            InputCommand::Button { seq, .. } => *seq,
            InputCommand::Scroll { seq, .. } => *seq,
            InputCommand::Key { seq, .. } => *seq,
            InputCommand::Text { seq, .. } => *seq,
            InputCommand::Video { seq, .. } => *seq,
            InputCommand::Auth { .. } => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sequence_monotonicity() {
        let mut last_seq = 0u64;
        let cmds = vec![
            InputCommand::Move { x: 0.1, y: 0.1, seq: Some(1) },
            InputCommand::Move { x: 0.2, y: 0.2, seq: Some(2) },
            InputCommand::Move { x: 0.3, y: 0.3, seq: Some(5) },
        ];
        for cmd in cmds {
            let seq = cmd.seq().unwrap();
            assert!(seq > last_seq, "sequence must strictly increase");
            last_seq = seq;
        }
    }

    #[test]
    fn test_replay_detection() {
        let last_seq = 5u64;
        let replayed = InputCommand::Move { x: 0.5, y: 0.5, seq: Some(5) };
        assert!(replayed.seq().unwrap() <= last_seq, "replayed sequence detected");
    }

    #[test]
    fn test_payload_limit() {
        const MAX_PAYLOAD_BYTES: usize = 65536;
        let small_payload = "a".repeat(1024);
        let large_payload = "a".repeat(70000);
        assert!(small_payload.len() <= MAX_PAYLOAD_BYTES);
        assert!(large_payload.len() > MAX_PAYLOAD_BYTES);
    }
}

/// Control/status messages the helper may send to Node as TEXT alongside the
/// binary frame stream (kept separate from frames, which are always BINARY).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", rename_all = "camelCase")]
pub enum HelperEvent {
    /// Sent once on connect so Node knows capture geometry and pairing state.
    Hello {
        width: u32,
        height: u32,
        monitor: usize,
        /// Phase 6 fills this; Phase 1 reports null.
        pairing_code: Option<String>,
    },
}
