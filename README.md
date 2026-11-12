# Project Dream Crypto Engine

**Status: experimental integration scaffold. Not production E2EE.**

This repository isolates the cryptographic integration from Project Dream's production Cloudflare Worker. It now includes a browser bootstrap for the official Matrix Rust Crypto WASM state machine.

## Current code
- `src/matrix-runtime.ts`: initializes `initAsync()` and a persistent browser `OlmMachine`.
- `src/index.ts`: retains a fail-closed placeholder for the Project Dream app adapter.
- `src/types.ts`: application-facing types only; not a protocol implementation.
- `docs/architecture.md`: required transport integration and go-live gates.

## Important limitation
Matrix Rust Crypto WASM is a no-network-I/O state machine for Matrix clients. It expects the application to exchange Matrix client-server API data with a homeserver. Project Dream currently uses a custom Cloudflare Worker + D1 API. The bootstrap in this repository does not bridge those systems and does not encrypt Project Dream messages.

Before real encryption can ship, we must either adopt Matrix client-server semantics end-to-end or implement and independently review the full required Matrix protocol adapter. Do not treat the bootstrap as a generic `encrypt(bytes)` function.

## Safety rules
- Existing production messages and attachments remain unchanged.
- The old `/e2ee-lab` remains experimental.
- Never label a message encrypted unless the client actually encrypted it and the recipient can decrypt it.
- Never upload private identity keys, ratchet state, or recovery secrets to Cloudflare.
- Never silently fall back to plaintext when encryption is expected.
- Make key changes and unverified devices visible.

## Development
```sh
npm install
npm run typecheck
```

## Upstream references
- [Crypto WASM source](https://github.com/matrix-org/matrix-sdk-crypto-wasm)
- [Crypto WASM API docs](https://matrix-org.github.io/matrix-sdk-crypto-wasm/)
- [OlmMachine API](https://matrix-org.github.io/matrix-sdk-crypto-wasm/classes/OlmMachine.html)
- [Rust crypto tutorial](https://matrix-org.github.io/matrix-rust-sdk/matrix_sdk_crypto/tutorial/index.html)
- [Matrix JS SDK](https://github.com/matrix-org/matrix-js-sdk)
