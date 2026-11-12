# Architecture decision record

## Selected candidate and current milestone

Use the official Matrix Rust Crypto WASM state machine (`@matrix-org/matrix-sdk-crypto-wasm`) as the candidate cryptographic engine. The package is initialized by `src/matrix-runtime.ts` using `initAsync()` and `OlmMachine.initialize()`. On web, the SDK supports IndexedDB-backed persistence.

**This milestone is runtime bootstrap only. It is not message encryption and does not make Project Dream E2EE.**

## Critical integration decision

The Rust crypto library is a no-network-I/O state machine. It expects the application to exchange Matrix client-server protocol data with a homeserver: sync responses, device/key APIs, to-device messages, and encrypted room events. Project Dream currently has a custom Cloudflare Worker + D1 transport.

There are two honest paths:
1. Adopt Matrix client-server semantics for the messaging backend (which is a significant backend and data-model migration); or
2. Build and independently review a complete protocol adapter implementing the required Matrix client-server API surface over the custom backend.

Do not call `OlmMachine` directly from Project Dream's existing message send route and assume encryption is integrated.

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
