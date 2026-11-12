/**
 * Boundary between Project Dream's custom Worker API and a future Matrix
 * client-server adapter. This file intentionally defines contracts only:
 * it does not claim the existing Worker implements Matrix endpoints.
 */

export type TransportReadiness =
  | { status: "unconfigured"; reason: string }
  | { status: "matrix-homeserver-required"; reason: string }
  | { status: "ready"; homeserverUrl: string };

export interface ProjectDreamTransportMapping {
  /** Project Dream account identifier; never assume it is a Matrix user ID. */
  accountId: string;
  /** Server-issued immutable device identifier. */
  deviceId: string;
  /** Explicit Matrix identity provisioned by a real Matrix homeserver. */
  matrixUserId: string;
  /** Explicit Matrix device ID provisioned by a real Matrix homeserver. */
  matrixDeviceId: string;
}

export function assessMatrixTransport(input: {
  homeserverUrl?: string;
  matrixUserId?: string;
  matrixDeviceId?: string;
}): TransportReadiness {
  if (!input.homeserverUrl || !input.matrixUserId || !input.matrixDeviceId) {
    return {
      status: "matrix-homeserver-required",
      reason: "Project Dream's current custom Worker API is not a Matrix homeserver. A Matrix homeserver URL, Matrix user ID, and Matrix device ID must be provisioned before the Matrix crypto machine can exchange protocol data.",
    };
  }

  let url: URL;
  try { url = new URL(input.homeserverUrl); } catch {
    return { status: "unconfigured", reason: "The configured homeserver URL is invalid." };
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    return { status: "unconfigured", reason: "The homeserver must use HTTPS." };
  }
  if (!input.matrixUserId.startsWith("@") || !input.matrixUserId.includes(":")) {
    return { status: "unconfigured", reason: "The Matrix user ID must be fully qualified." };
  }
  if (!input.matrixDeviceId.trim()) {
    return { status: "unconfigured", reason: "A stable Matrix device ID is required." };
  }
  return { status: "ready", homeserverUrl: url.origin };
}
