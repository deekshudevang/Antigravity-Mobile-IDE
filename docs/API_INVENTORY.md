# Antigravity Remote — API Inventory & Classification

Date: 2026-11-16  
Status: Stage A Baseline Audit  

Every HTTP route and WebSocket message is classified into exactly one endpoint security class (Section 5.3a):
- `PUBLIC_HEALTH`: No auth. Returns only liveness and version string; no internal paths, config, or sensitive state.
- `PAIRING_BOOTSTRAP`: No access token (caller has no credentials yet). Requires a valid single-use, short-lived pairing code, heavily rate limited.
- `LOCAL_ADMIN`: Served on a separate loopback-only listener (or CLI/named pipe) never published through Tailscale Serve, plus local OS identity check.
- `AUTHENTICATED_API`: Valid, unexpired access token + required capabilities.
- `AUTHENTICATED_WEBSOCKET`: Authenticated at upgrade + authorized per message type.

---

## 1. HTTP Endpoints Inventory

| Method | Path | Current Auth | Target Security Class | Required Capabilities | Description |
|---|---|---|---|---|---|
| `GET` | `/` | None | `AUTHENTICATED_API` | `status.read` | Web dashboard inlined HTML (or PUBLIC_HEALTH redirect) |
| `GET` | `/api/status` | None | `PUBLIC_HEALTH` | None | Liveness and version only (strip internal paths/tokens) |
| `POST` | `/api/pair` | Code param (no rate limit) | `PAIRING_BOOTSTRAP` | None | Submit single-use pairing code to obtain initial access & refresh token |
| `GET` | `/api/pair/status` | Optional `x-device-token` | `AUTHENTICATED_API` | `status.read` | Check pairing / device identity validation status |
| `POST` | `/api/auth/token/refresh` | None (New) | `AUTHENTICATED_API` | None (Refresh Credential) | Rotate refresh credential and issue new short-lived access token |
| `POST` | `/api/auth/revoke` | None (New) | `AUTHENTICATED_API` | `session.revoke` | Revoke a device's credential family; disconnects active sockets |
| `POST` | `/api/auth/login` | PIN check (IP-based limit) | `AUTHENTICATED_API` | None (Step-up PIN) | Step-up PIN authentication for sensitive operations |
| `POST` | `/api/auth/logout` | Token in Header | `AUTHENTICATED_API` | `session.revoke` | Invalidate active access token and refresh credential |
| `GET` | `/api/auth/status` | None | `PUBLIC_HEALTH` | None | Reports whether PIN step-up is enabled |
| `GET` | `/api/cdp/status` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | CDP connection status and target reachability |
| `GET` | `/api/cdp/targets` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | List active CDP targets |
| `GET` | `/api/cdp/sources` | None | `AUTHENTICATED_API` | `status.read` | Discoverable Antigravity targets (2.0 vs IDE) |
| `POST` | `/api/cdp/target` | None | `AUTHENTICATED_API` | `prompt.submit` | Switch active CDP target source |
| `GET` | `/api/cdp/chat` | `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Live chat messages extracted from IDE |
| `GET` | `/api/cdp/conversation`| `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Raw conversation text from IDE panel |
| `GET` | `/api/cdp/panel` | `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Agent panel content |
| `POST` | `/api/cdp/inject` | `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Inject prompt text into agent input |
| `POST` | `/api/cdp/focus` | `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Focus agent input element |
| `POST` | `/api/cdp/click` | `authEnabled` bypass | `AUTHENTICATED_API` | `approval.respond` | Click DOM element by XPath |
| `GET` | `/api/cdp/screenshot`| `authEnabled` bypass | `AUTHENTICATED_API` | `screen.view` | Capture IDE window screenshot via CDP |
| `GET` | `/api/cdp/screen.png` | `authEnabled` bypass | `AUTHENTICATED_API` | `screen.view` | Raw screenshot image stream via CDP |
| `GET` | `/api/chat/snapshot` | `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | DOM snapshot of chat area |
| `GET` | `/api/chat/structured`| `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Clean JSON structured message model |
| `GET` | `/api/chat/conversations`| `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | List available conversation sessions |
| `POST` | `/api/chat/conversations/switch`| `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Switch active conversation |
| `POST` | `/api/chat/conversations/new`| `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Start a new conversation session |
| `POST` | `/api/chat/answer` | `authEnabled` bypass | `AUTHENTICATED_API` | `approval.respond` | Answer multiple-choice prompt from agent |
| `POST` | `/api/chat/stop-agent`| `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Abort/stop running agent task |
| `POST` | `/api/chat/start` | `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Start chat polling/stream |
| `POST` | `/api/chat/stop` | `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Stop chat polling/stream |
| `GET` | `/api/chat/status` | `authEnabled` bypass | `AUTHENTICATED_API` | `conversation.read` | Check chat stream status |
| `POST` | `/api/commands/execute` | **NONE** (Critical Flaw) | `AUTHENTICATED_API` | `prompt.submit`, `command.execute` | Execute prompt/command against agent |
| `GET` | `/api/quota` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | Model quota and usage statistics |
| `GET` | `/api/quota/status`| `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | Quota service availability |
| `GET` | `/api/models` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | List available models |
| `POST` | `/api/models/set` | `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Switch active LLM model |
| `GET` | `/api/modes` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | List available agent execution modes |
| `POST` | `/api/modes/set` | `authEnabled` bypass | `AUTHENTICATED_API` | `prompt.submit` | Switch agent mode (Planning/Fast) |
| `GET` | `/api/approvals` | `authEnabled` bypass | `AUTHENTICATED_API` | `approval.respond` | Check pending approval requests |
| `POST` | `/api/approvals/respond`| `authEnabled` bypass | `AUTHENTICATED_API` | `approval.respond` | Approve or reject pending agent action |
| `GET` | `/api/workspace` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | Get current workspace path |
| `POST` | `/api/workspace` | `authEnabled` bypass | `AUTHENTICATED_API` | `device.manage` | Set workspace path |
| `POST` | `/api/workspace/reset`| `authEnabled` bypass | `AUTHENTICATED_API` | `device.manage` | Reset workspace to detected IDE path |
| `GET` | `/api/repos` | None | `AUTHENTICATED_API` | `status.read` | List configured workspace roots |
| `POST` | `/api/repos` | None | `AUTHENTICATED_API` | `device.manage` | Add repository root |
| `DELETE`| `/api/repos` | None | `AUTHENTICATED_API` | `device.manage` | Remove repository root |
| `POST` | `/api/repos/select` | None | `AUTHENTICATED_API` | `device.manage` | Select repository workspace |
| `GET` | `/api/dirs` | `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `files.read` | Directory picker listing |
| `POST` | `/api/launch/ide` | `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `command.execute` | Launch IDE on specified directory |
| `POST` | `/api/launch/conversation`| `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `command.execute` | Launch Antigravity app on directory |
| `GET` | `/api/files` | `authEnabled` bypass | `AUTHENTICATED_API` | `files.read` | List files within workspace root |
| `GET` | `/api/files/content`| `authEnabled` bypass | `AUTHENTICATED_API` | `files.read` | Read text file content |
| `POST` | `/api/files/save` | `authEnabled` bypass | `AUTHENTICATED_API` | `files.write` | Save file content |
| `GET` | `/api/files/raw` | `authEnabled` bypass | `AUTHENTICATED_API` | `files.read` | Get raw file (images only) |
| `GET` | `/api/files/download`| `authEnabled` bypass | `AUTHENTICATED_API` | `files.read` | Download single file |
| `POST` | `/api/files/upload`| `authEnabled` bypass | `AUTHENTICATED_API` | `files.write` | Upload file into workspace |
| `POST` | `/api/files/download-zip`| `authEnabled` bypass | `AUTHENTICATED_API` | `files.read` | Download zip archive of files |
| `POST` | `/api/files/unwatch`| `authEnabled` bypass | `AUTHENTICATED_API` | `files.read` | Stop file watcher |
| `GET` | `/api/git/status` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | Git working tree status |
| `GET` | `/api/git/diff` | `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | Git diff for file |
| `GET` | `/api/git/branches`| `authEnabled` bypass | `AUTHENTICATED_API` | `status.read` | List branches |
| `POST` | `/api/git/stage` | `authEnabled` bypass | `AUTHENTICATED_API` | `git.write` | Stage file in git index |
| `POST` | `/api/git/unstage` | `authEnabled` bypass | `AUTHENTICATED_API` | `git.write` | Unstage file |
| `POST` | `/api/git/discard` | `authEnabled` bypass | `AUTHENTICATED_API` | `git.write` | Discard changes |
| `POST` | `/api/git/commit` | `authEnabled` bypass | `AUTHENTICATED_API` | `git.write` | Create local commit |
| `POST` | `/api/git/checkout`| `authEnabled` bypass | `AUTHENTICATED_API` | `git.write` | Switch git branch |
| `GET` | `/api/screen/live.jpg`| None | `AUTHENTICATED_API` | `screen.view` | Latest whole-desktop JPEG frame |
| `POST` | `/api/screen/click`| `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `screen.input` | Inject mouse click |
| `POST` | `/api/screen/mouse`| `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `screen.input` | Inject mouse move/press/release |
| `POST` | `/api/screen/type` | `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `screen.input` | Inject keyboard text |
| `POST` | `/api/screen/key` | `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `screen.input` | Inject keyboard key combo |
| `POST` | `/api/screen/scroll`| `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `screen.input` | Inject mouse scroll |
| `POST` | `/api/screen/codec`| `requirePaired` (Legacy token) | `AUTHENTICATED_API` | `screen.view` | Switch stream codec (jpeg/h264) |
| `GET` | `/api/clipboard` | `authEnabled` bypass | `AUTHENTICATED_API` | `screen.view` | Read PC clipboard |
| `POST` | `/api/clipboard` | `authEnabled` bypass | `AUTHENTICATED_API` | `screen.input` | Write PC clipboard |
| `GET` | `/api/screenshots` | None | `AUTHENTICATED_API` | `screen.view` | List captured screenshots |
| `GET` | `/api/screenshots/:filename`| None | `AUTHENTICATED_API` | `screen.view` | Get specific screenshot |
| `GET` | `/api/tasks` | None (New) | `AUTHENTICATED_API` | `tasks.read` | Parse and return task.md status |
| `GET` | `/api/process/builds`| None (New) | `AUTHENTICATED_API` | `process.observe` | Observe active build/terminal processes |
| `GET` | `/admin` | `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Admin web page |
| `GET` | `/setup` | `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Setup wizard web page |
| `GET` | `/api/setup/status`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Setup diagnostic status |
| `POST` | `/api/setup/antigravity-path`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Update Antigravity binary path |
| `POST` | `/api/setup/launch-antigravity`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Launch Antigravity with CDP |
| `POST` | `/api/setup/helper/build`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Trigger cargo build of helper |
| `POST` | `/api/setup/helper/start`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Start desktop helper |
| `GET` | `/api/admin/config`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Read server config |
| `POST` | `/api/admin/config`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Write server config |
| `GET` | `/api/admin/status`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Full admin server status |
| `GET` | `/api/admin/devices`| `localhostOnly` | `LOCAL_ADMIN` | `device.manage` | List paired devices & tokens |
| `POST` | `/api/admin/devices/revoke`| `localhostOnly` (New) | `LOCAL_ADMIN` | `session.revoke` | Revoke device identity & tokens |
| `POST` | `/api/admin/pairing/generate`| `localhostOnly` (New) | `LOCAL_ADMIN` | `device.manage` | Generate new 5-minute pairing code |
| `GET` | `/api/admin/events`| `localhostOnly` | `LOCAL_ADMIN` | `logs.read` | Audit log & activity events |
| `GET` | `/api/admin/logs` | `localhostOnly` | `LOCAL_ADMIN` | `logs.read` | List persistent log files |
| `GET` | `/api/admin/logs/:filename`| `localhostOnly` | `LOCAL_ADMIN` | `logs.read` | View specific log file |
| `DELETE`| `/api/admin/logs`| `localhostOnly` | `LOCAL_ADMIN` | `security.configure` | Clear persistent logs |

---

## 2. WebSocket Messages Inventory

| Transport | Direction | Message Type / Action | Current Auth | Target Security Class | Required Capabilities | Lifecycle / Notes |
|---|---|---|---|---|---|---|
| Upgrade | Client -> Server | `GET /` (HTTP Upgrade) | None | `AUTHENTICATED_WEBSOCKET` | Valid access token in query param or auth subprotocol | Rejects unauthenticated connections with close code 4401 |
| In-band | Client -> Server | `auth_refresh` | None (New) | `AUTHENTICATED_WEBSOCKET` | None (access token) | Reauthorize before access token expires |
| In-band | Client -> Server | `inject` | None | `AUTHENTICATED_WEBSOCKET` | `prompt.submit` | Prompt submission lifecycle: SUBMITTED -> ACCEPTED -> DELIVERED -> STARTED |
| In-band | Client -> Server | `screenshot` | None | `AUTHENTICATED_WEBSOCKET` | `screen.view` | Request single frame |
| In-band | Client -> Server | `watch_screen` | None | `AUTHENTICATED_WEBSOCKET` | `screen.view` | Subscribe to live screen stream |
| In-band | Client -> Server | `ping` | None | `AUTHENTICATED_WEBSOCKET` | None | Heartbeat ping; server replies `pong` |
| In-band | Server -> Client | `history` | None | `AUTHENTICATED_WEBSOCKET` | `conversation.read` | Initial event buffer upon connection |
| In-band | Server -> Client | `chat_update` | None | `AUTHENTICATED_WEBSOCKET` | `conversation.read` | Real-time chat streaming event |
| In-band | Server -> Client | `agent_event` | None | `AUTHENTICATED_WEBSOCKET` | `status.read` | Agent state transitions (running, idle, waiting, error) |
| In-band | Server -> Client | `approval_needed` | None | `AUTHENTICATED_WEBSOCKET` | `approval.respond` | Command or tool approval request |
| In-band | Server -> Client | `command_lifecycle`| None (New) | `AUTHENTICATED_WEBSOCKET` | `prompt.submit` | State machine updates for prompt delivery |
| In-band | Server -> Client | `workspace_changed`| None | `AUTHENTICATED_WEBSOCKET` | `status.read` | Workspace root change broadcast |
| In-band | Server -> Client | `binary frame` | None | `AUTHENTICATED_WEBSOCKET` | `screen.view` | JPEG or H.264 desktop frame |
| In-band | Server -> Client | `auth_expired` | None (New) | `AUTHENTICATED_WEBSOCKET` | None | Close code 4401 sent on expiry |
| In-band | Server -> Client | `revoked` | None (New) | `AUTHENTICATED_WEBSOCKET` | None | Close code 4403 sent immediately on revocation |
