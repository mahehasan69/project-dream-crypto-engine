export * from "./types.js";

import { CryptoUnavailableError } from "./types.js";

/**
 * Fail-closed placeholder. This intentionally cannot encrypt or decrypt.
 * Do not replace it with the experimental lab or raw WebCrypto primitives.
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
