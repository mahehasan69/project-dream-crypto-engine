# Project Dream integration boundary

## Current backend reality

Project Dream's deployed Cloudflare Worker uses custom authentication, D1 message storage, Durable Objects, and R2 media. It is not currently a Matrix homeserver and does not expose the Matrix Client-Server API.

The Matrix Rust Crypto WASM state machine cannot be connected safely by changing only the browser's encryption call. The application must provide the protocol I/O expected by the state machine.

## Integration choices

### A. Adopt a Matrix homeserver
Provision a Matrix homeserver and Matrix identities/devices. The app then uses Matrix Client-Server APIs for sync, key upload/claim, to-device messages, room events, and encrypted attachments. Project Dream can remain the custom branded client, but the messaging backend/data model changes.

### B. Implement a Matrix protocol adapter over the existing Worker
This is a substantial project. The Worker must implement and correctly persist the relevant Matrix Client-Server API semantics, transaction idempotency, device/key APIs, sync cursors, to-device queues, room membership/state, and encrypted event storage. A thin proxy around the existing plaintext D1 message route is not enough.

## Current repository milestone

- Matrix WASM bootstrap exists.
- Matrix HTTP transport primitives exist for a real Matrix homeserver.
- A readiness contract explicitly prevents treating the existing Project Dream Worker as Matrix.
- No production message encryption is enabled.
- No production Worker code or D1 data has been changed.

## Next validation
1. Install dependencies and run typecheck.
2. Run transport contract tests.
3. Provision a test Matrix homeserver and two test Matrix accounts/devices.
4. Connect OlmMachine to Matrix sync/key/to-device flows.
5. Verify two-device encryption/decryption and device verification.
6. Only then design a non-destructive Project Dream integration and migration.
