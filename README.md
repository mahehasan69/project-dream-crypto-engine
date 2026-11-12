# Project Dream Crypto Engine — isolated integration scaffold

**Status: scaffold only. Not production E2EE.**

This package establishes a safe boundary between Project Dream's chat transport and a future maintained cryptographic implementation. It deliberately does not implement cryptography, derive keys, or encrypt production messages.

## Why separate?
Project Dream currently uses a custom Cloudflare Worker + D1 chat backend. Matrix Rust Crypto WASM is a Matrix client crypto state machine, not a drop-in generic encryption function. It requires client integration for device/key APIs and encrypted room-event flows. Importing it alone will not make Project Dream E2EE.

## Safety rules
- Existing production messages and attachments remain unchanged.
- The old `/e2ee-lab` remains experimental.
- Never label a message encrypted unless the client actually encrypted it and the recipient can decrypt it.
- Never upload private identity keys, ratchet state, or recovery secrets to Cloudflare.
- Never silently fall back to plaintext when encryption is expected.
- Make key changes and unverified devices visible.

## Next engineering steps
1. Choose the integration model: adopt Matrix client-server semantics end-to-end, or build and independently review a custom transport adapter around a maintained protocol library.
2. Build a browser adapter with persistent encrypted local state.
3. Implement authenticated device discovery, key upload/claim, to-device delivery, encrypted send/receive, verification, and recovery.
4. Add protocol-level tests using two independent browser profiles.
5. Only after security review, plan an opt-in migration for new conversations. Preserve existing conversations.

## Upstream
- Crypto WASM: https://github.com/matrix-org/matrix-sdk-crypto-wasm
- Matrix JS SDK: https://github.com/matrix-org/matrix-js-sdk
- Rust SDK: https://github.com/matrix-org/matrix-rust-sdk

See `docs/architecture.md`.
