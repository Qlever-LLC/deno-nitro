/**
 * @license
 * Copyright 2025 Qlever LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Test suite for deno-nitro
 *
 * This file contains unit tests for the deno-nitro library functionality.
 * Tests cover attestation generation, validation, and error handling.
 *
 * @todo implement mock attestation for local/CI testing
 */

import { Buffer } from "node:buffer";
import { assertEquals, assertInstanceOf } from "@std/assert";

import { attest, validate } from "./mod.ts";

Deno.test(function attestBasicTest() {
  const userData = { message: "test data", timestamp: Date.now() };
  const attestation = attest(userData);

  // Should return a Uint8Array
  assertInstanceOf(attestation, Uint8Array);

  // Should have non-zero length
  assertEquals(attestation.length > 0, true);
});

Deno.test(function attestAndValidateTest() {
  const userData = "simple string test";
  const attestation = attest(userData);
  const decoded = validate(attestation);

  // Should have the expected structure
  assertEquals(typeof decoded.payload, "object");
  assertEquals(decoded.payload.user_data, userData);
});
const quote = Buffer.from(
  await Deno.readTextFile("./test-quote.b64"),
  "base64",
);

// TODO: Add a real test once mock attestation is implemented
Deno.test(function attestTest() {
  const output = attest(quote);
  assertEquals(output, Uint8Array.from(""));
});
