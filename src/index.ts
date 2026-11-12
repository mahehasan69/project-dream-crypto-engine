export * from "./types.js";
export * from "./matrix-runtime.js";

import { CryptoUnavailableError } from "./types.js";

/**
 * Fail-closed application adapter placeholder.
 * Matrix OlmMachine initialization alone does not implement Project Dream's
 * custom message transport or make its messages end-to-end encrypted.
 */
export const cryptoEngine = {
  protocolId: "unconfigured",
  async initialize(_accountId: string, _deviceId: string): Promise<void> { throw new CryptoUnavailableError(); },
  async listDevices(_userId: string) { throw new CryptoUnavailableError(); },
  async encrypt(_recipientUserId: string, _contentType: "text" | "attachment" | "voice", _plaintext: Uint8Array) { throw new CryptoUnavailableError(); },
  async decrypt(_envelope: unknown): Promise<Uint8Array> { throw new CryptoUnavailableError(); },
  async verifyDevice(_device: unknown): Promise<void> { throw new CryptoUnavailableError(); },
  async close(): Promise<void> {},
};
