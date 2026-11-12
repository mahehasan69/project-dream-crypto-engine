export type DeviceTrust = "verified" | "unverified" | "blocked";

export interface DeviceDescriptor {
  userId: string;
  deviceId: string;
  identityFingerprint: string;
  trust: DeviceTrust;
}

export interface EncryptedEnvelope {
  version: 1;
  protocol: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  contentType: "text" | "attachment" | "voice";
  ciphertext: string;
  messageId: string;
}

/** Interface only: implementations must use a maintained, reviewed protocol. */
export interface CryptoEngine {
  readonly protocolId: string;
  initialize(accountId: string, deviceId: string): Promise<void>;
  listDevices(userId: string): Promise<DeviceDescriptor[]>;
  encrypt(recipientUserId: string, contentType: EncryptedEnvelope["contentType"], plaintext: Uint8Array): Promise<EncryptedEnvelope[]>;
  decrypt(envelope: EncryptedEnvelope): Promise<Uint8Array>;
  verifyDevice(device: DeviceDescriptor): Promise<void>;
  close(): Promise<void>;
}

export class CryptoUnavailableError extends Error {
  constructor(message = "A production E2EE backend has not been configured.") {
    super(message);
    this.name = "CryptoUnavailableError";
  }
}
