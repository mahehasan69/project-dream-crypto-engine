import { strict as assert } from "node:assert";
import { test } from "node:test";
import { assessMatrixTransport } from "../src/transport-contract.js";

test("does not treat the custom Project Dream Worker as a Matrix homeserver by default", () => {
  const result = assessMatrixTransport({});
  assert.equal(result.status, "matrix-homeserver-required");
});

test("rejects an invalid Matrix user ID", () => {
  const result = assessMatrixTransport({
    homeserverUrl: "https://matrix.example.org",
    matrixUserId: "mahe",
    matrixDeviceId: "DEVICE_A",
  });
  assert.equal(result.status, "unconfigured");
});

test("accepts an explicitly provisioned HTTPS Matrix identity", () => {
  const result = assessMatrixTransport({
    homeserverUrl: "https://matrix.example.org",
    matrixUserId: "@alice:example.org",
    matrixDeviceId: "BROWSER_DEVICE_A",
  });
  assert.deepEqual(result, {
    status: "ready",
    homeserverUrl: "https://matrix.example.org",
  });
});
