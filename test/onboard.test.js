// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  cleanupGatewayVolumes,
  gatewayVolumeCandidates,
  manualGatewayVolumeCleanupCommand,
} = require("../bin/lib/onboard");

describe("gateway cleanup helpers", () => {
  it("uses the known OpenShell volume name for the default gateway", () => {
    assert.deepEqual(gatewayVolumeCandidates(), ["openshell-cluster-nemoclaw"]);
  });

  it("removes known gateway volumes when they exist", () => {
    const commands = [];
    const runFn = (cmd) => {
      commands.push(cmd);
      if (cmd.includes("docker volume inspect")) return { status: 0 };
      if (cmd.includes("docker volume rm -f")) return { status: 0 };
      return { status: 1 };
    };

    const result = cleanupGatewayVolumes(runFn);

    assert.deepEqual(result, {
      removedVolumes: ["openshell-cluster-nemoclaw"],
      failedVolumes: [],
    });
    assert.equal(commands.length, 2);
  });

  it("returns the exact manual recovery command when automatic cleanup fails", () => {
    const runFn = (cmd) => {
      if (cmd.includes("docker volume inspect")) return { status: 0 };
      if (cmd.includes("docker volume rm -f")) return { status: 1 };
      return { status: 1 };
    };

    const result = cleanupGatewayVolumes(runFn);

    assert.deepEqual(result, {
      removedVolumes: [],
      failedVolumes: ["openshell-cluster-nemoclaw"],
    });
    assert.equal(
      manualGatewayVolumeCleanupCommand(result.failedVolumes),
      "docker volume rm -f 'openshell-cluster-nemoclaw'"
    );
  });
});
