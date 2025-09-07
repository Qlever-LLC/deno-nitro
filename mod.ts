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
 * @fileoverview Main module for deno-nitro - AWS Nitro Enclaves attestation for Deno
 * @author Alex Layton <alex@qlever.io>
 *
 * This module provides a TypeScript interface to AWS Nitro Security Module (NSM)
 * functionality through Rust FFI bindings. It allows you to generate cryptographically
 * signed attestation documents from within AWS Nitro Enclaves.
 *
 * @example
 * ```typescript
 * import { attest, validate } from "./mod.ts";
 *
 * const userData = { message: "Hello from secure enclave!" };
 * const attestation = attest(userData);
 * const decoded = validate(attestation);
 * console.log(decoded.payload.user_data);
 * ```
 */

import { decode, encode } from "cbor-x";

import { attest as bAttest } from "./bindings/bindings.ts";

/**
 * Create an attestation with arbitrary serializeable input data
 * @param [input]
 * Arbitrary input data to include as `user_data` in the attestation
 * @return
 * COSE_Sign1 attestation as a Uint8Array
 */
export function attest(input?: unknown): Uint8Array {
  /**
   * Turn arbitrary input into CBOR
   */
  const bytes = encode(input);
  return bAttest(bytes);
}

function decodeCose(cose: Uint8Array) {
  const [protectedHeaders, unprotectedHeaders, payload, signature] = decode(
    cose,
  );
  const { user_data, ...data } = decode(payload);
  return {
    protectedHeaders: decode(protectedHeaders),
    /// This is sometimes empty?
    unprotectedHeaders: unprotectedHeaders instanceof Uint8Array
      ? decode(unprotectedHeaders)
      : unprotectedHeaders,
    payload: {
      ...data,
      user_data: user_data instanceof Uint8Array
        ? decode(user_data)
        : user_data,
    },
    signature,
  };
}

/**
 * Validate and decode an attestation
 * @param attestation The attestation to validate and decode
 * @return
 * decoded attestation,
 * including protected and unprotected headers, payload, and signature
 * @todo validate the attestation signature and protected headers
 */
export function validate(attestation: Uint8Array): {
  protectedHeaders: unknown;
  unprotectedHeaders: unknown;
  payload: Record<string, unknown>;
  signature: Uint8Array;
} {
  const cose = decodeCose(attestation);
  return cose;
}
