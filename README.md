# @Qlever-LLC/deno-nitro

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A Deno library for AWS Nitro Enclaves attestation, providing a TypeScript
interface to AWS Nitro security features through Rust bindings.

## Features

- 🔐 **Nitro Attestation**: Generate cryptographically signed attestation
  documents from within AWS Nitro Enclaves
- 🔍 **CBOR Support**: Automatic encoding/decoding of arbitrary data using CBOR
  (Concise Binary Object Representation)
- 🦀 **Rust Performance**: High-performance Rust back-end with Deno FFI bindings
- 🧪 **Development Mode**: Built-in development driver for local testing without
  actual Nitro hardware
- 📦 **Zero Config**: Simple API that handles the complexity of attestation
  document generation

## Installation

```typescript
// Import directly from JSR
import { attest, validate } from "jsr:@qlever-llc/deno-nitro@0.1.0";
```

## Quick Start

### Basic Attestation

```typescript
import { attest, validate } from "jsr:@qlever-llc/deno-nitro@0.1.0";

// Attest any serializable data structure
const userData = {
  timestamp: Date.now(),
  operation: "secure-computation",
  result: "success",
};

// Generate attestation document
const attestationDoc = attest(userData);
console.log("Attestation document generated:", attestationDoc.length, "bytes");

// Validate and decode the attestation
const decoded = validate(attestationDoc);
console.log("Decoded payload:", decoded.payload.user_data);
```

### Working with Binary Data

```typescript
// Attest binary data
const binaryData = new TextEncoder().encode("sensitive information");
const attestation = attest(binaryData);

// The attestation document is a CBOR-encoded COSE
// (CBOR Object Signing and Encryption) structure
const result = validate(attestation);
console.log("Protected headers:", result.protectedHeaders);
console.log("User data:", result.payload.user_data);
```

## API Reference

### `attest(input: unknown): Uint8Array`

Generates a cryptographically signed attestation document for the given input.

**Parameters:**

- `input` - Any serializable data to include in the attestation

**Returns:**

- `Uint8Array` - The attestation document in CBOR format

### `validate(attestation: Uint8Array): AttestationResult`

Decodes and validates an attestation document.

**Parameters:**

- `attestation` - The attestation document bytes

**Returns:**

- Object containing:
  - `protectedHeaders` - COSE protected headers
  - `unprotectedHeaders` - COSE unprotected headers
  - `payload` - The attestation payload including user data
  - `signature` - The cryptographic signature

## Development

### Prerequisites

- [Deno](https://deno.land/) 1.40+
- [deno_bindgen](https://crates.io/crates/deno_bindgen#installation) 0.8.1+
- [Rust](https://rustup.rs/) 1.70+
- [Cargo](https://doc.rust-lang.org/cargo/)

### Building

```sh
# Build the Rust library
deno_bindgen

# Run tests
deno test

# Development mode with file watching
deno task dev
```

### Crate Features

The Rust crate supports several feature flags:

- `nitro` (default) - Use actual AWS Nitro hardware
- `dev` - Enable development mode with mock attestations

```sh
# Build for development (uses mock driver)
cargo build --no-default-features --features dev

# Build for production (uses real Nitro hardware)
cargo build --features nitro
```

## How It Works

1. **Input Encoding**: Your data is encoded into CBOR format
2. **Attestation Request**: The Rust back-end calls the AWS Nitro Security
   Module (NSM)
3. **Document Generation**: NSM generates a cryptographically signed attestation
   document
4. **COSE Format**: The result is returned as a COSE (CBOR Object Signing and
   Encryption) structure
5. **Validation**: The `validate` function can decode and inspect the
   attestation

## Security Considerations

- Attestation documents are only cryptographically valid when generated within
  actual AWS Nitro Enclaves
- In development mode, mock attestations are generated for testing purposes only
- Always validate attestation documents in production environments
- The attestation includes platform configuration registers (PCRs) that can be
  used to verify enclave integrity

## Use Cases

- **Confidential Computing**: Prove that code is running in a secure enclave
- **Zero-Trust Architectures**: Verify the integrity of computational
  environments
- **Secure Multi-Party Computation**: Attest to the correctness of distributed
  computations
- **Compliance & Auditing**: Generate cryptographic proof of secure data
  processing

## Project Structure

```tree
├── src/lib.rs           # Rust attestation logic
├── bindings/bindings.ts # Auto-generated Deno FFI bindings
├── mod.ts               # Main TypeScript module
├── mod_test.ts          # Test suite
├── Cargo.toml           # Rust dependencies and configuration
└── deno.json            # Deno project configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`deno test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for
details.

## Acknowledgments

- Built with [deno_bindgen](https://github.com/denoland/deno_bindgen) for
  seamless Rust-Deno integration
- Uses
  [nsm-nitro-enclave-utils](https://crates.io/crates/nsm-nitro-enclave-utils)
  for AWS Nitro integration
- CBOR handling provided by [cbor-x](https://github.com/kriszyp/cbor-x)
