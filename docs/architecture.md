# Architecture decision record

## Candidate
Evaluate Matrix Rust Crypto WASM (`@matrix-org/matrix-sdk-crypto-wasm`) as the browser cryptographic state machine. It exposes `OlmMachine` and is a no-network-I/O state machine. The client application must implement Matrix client-server API integration. It is not a generic `encrypt(bytes)` SDK and does not automatically fit Project Dream's custom D1 schema.

## Required integration
- Persistent IndexedDB crypto state; single-instance ownership per browser profile.
- Device identity, device lists, key upload and one-time/fallback key claims.
- Authenticated to-device delivery.
- Encrypted event construction and decryption.
- Device verification, cross-signing, key-change notifications.
- Recovery / secret storage and device migration.
- Replay handling, duplicate delivery, offline queues and retries.
- Attachments encrypted locally before R2 upload; attachment keys only in encrypted message payloads.

## Server boundary
Keep private keys and cryptographic state on clients. Cloudflare relays opaque ciphertext and public key material only. D1 must not receive plaintext bodies or attachment encryption keys after production E2EE is enabled.

## Fail-closed
If encryption is required and the crypto engine is unavailable, stop sending with a clear error. Do not downgrade to `TLS-ONLY-PLAINTEXT`.

## Go-live gate
No rollout until two independently provisioned clients pass interoperability, verification, key-change, replay/tamper, persistence/restart, and attachment tests, followed by independent security review.
