import { describe, expect, it } from "vitest";
import { assessMatrixTransport } from "../src/transport-contract.js";

describe("Matrix transport readiness", () => {
  it("does not treat Project Dream's custom Worker as a Matrix homeserver by default", () => {
    expect(assessMatrixTransport({}).status).toBe("matrix-homeserver-required");
  });

  it("rejects an invalid Matrix user ID", () => {
    expect(assessMatrixTransport({
      homeserverUrl: "https://matrix.example.org",
      matrixUserId: "mahe",
      matrixDeviceId: "DEVICE_A",
    }).status).toBe("unconfigured");
  });

  it("accepts an explicitly provisioned HTTPS Matrix identity", () => {
    expect(assessMatrixTransport({
      homeserverUrl: "https://matrix.example.org",
      matrixUserId: "@alice:example.org",
      matrixDeviceId: "BROWSER_DEVICE_A",
    })).toEqual({
      status: "ready",
      homeserverUrl: "https://matrix.example.org",
    });
  });
});
