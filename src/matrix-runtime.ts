import {
  DeviceId,
  initAsync,
  OlmMachine,
  UserId,
} from "@matrix-org/matrix-sdk-crypto-wasm";

export interface MatrixCryptoIdentity {
  /** Matrix user ID, e.g. @alice:example.org (not a Project Dream username). */
  userId: string;
  /** Stable, unique device ID for this browser installation. */
  deviceId: string;
  /**
   * Optional passphrase for the SDK's persistent crypto store.
   * Obtain this from a user-controlled secure setup flow; never hardcode it
   * or send it to the Project Dream Worker.
   */
  storePassphrase?: string;
  /** Optional IndexedDB store name. Must remain stable for this device. */
  storeName?: string;
}

let wasmInitialization: Promise<void> | undefined;

/**
 * Initialize the official Matrix Rust Crypto WASM state machine in the browser.
 *
 * This is only the local crypto-runtime bootstrap. It does NOT by itself:
 * - connect Project Dream's custom D1/Worker API to Matrix client-server APIs;
 * - upload/claim keys or deliver to-device events;
 * - encrypt/decrypt Project Dream messages;
 * - provide verification, recovery, or a production E2EE rollout.
 *
 * A full Matrix protocol transport integration is still required.
 */
export async function initializeMatrixCrypto(
  identity: MatrixCryptoIdentity,
): Promise<OlmMachine> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    throw new Error("Matrix browser crypto requires a browser with IndexedDB.");
  }

  if (!identity.userId.startsWith("@") || !identity.userId.includes(":")) {
    throw new Error("userId must be a fully-qualified Matrix user ID.");
  }

  if (!identity.deviceId.trim()) {
    throw new Error("deviceId is required and must remain stable for this device.");
  }

  wasmInitialization ??= initAsync();
  await wasmInitialization;

  // The SDK uses IndexedDB persistence on web when available. Keep exactly
  // one OlmMachine owner per store/profile; multiple instances can corrupt state.
  return OlmMachine.initialize(
    new UserId(identity.userId),
    new DeviceId(identity.deviceId),
    identity.storeName,
    identity.storePassphrase,
  );
}
