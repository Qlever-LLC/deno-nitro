/*!
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

/*! # deno-nitro Rust Backend
 * This module provides the Rust implementation for AWS Nitro Enclaves attestation
 * functionality. It interfaces with the AWS Nitro Security Module (NSM) to generate
 * cryptographically signed attestation documents.
 *
 * ## Features
 *
 * - `nitro` (default): Uses actual AWS Nitro hardware for attestation
 * - `dev`: Uses a mock driver for local development and testing
 *
 * ## Architecture
 *
 * The module uses a lazy-static Nitro driver instance that is initialized once
 * and shared across all attestation requests. In production mode (`nitro` feature),
 * it connects to the real NSM. In development mode (`dev` feature), it uses a
 * mock driver with test certificates for local development.
 *
 * ## Safety
 *
 * This module uses FFI to expose functions to Deno through `deno_bindgen`.
 * The attestation functions are safe to call from multiple threads.
 */

use deno_bindgen::deno_bindgen;
use nsm_nitro_enclave_utils::driver::nitro::Nitro;
use nsm_nitro_enclave_utils::{
    api::{
        ByteBuf,
        nsm::{Request, Response},
    },
    driver::Driver,
};
#[cfg(not(feature = "nitro"))]
use nsm_nitro_enclave_utils::{
    api::{DecodePrivateKey, SecretKey},
    pcr::Pcrs,
};
use std::sync::Arc;

#[macro_use]
extern crate lazy_static;

#[cfg(feature = "dev")]
#[derive(clap::Parser, Debug)]
struct Args {
    #[arg(
        long,
        allow_hyphen_values = true,
        default_value = "./test_data/end-signing-key.der"
    )]
    signing_key: std::path::PathBuf,
    #[arg(
        long,
        allow_hyphen_values = true,
        default_value = "./test_data/end-certificate.der"
    )]
    end_cert: std::path::PathBuf,
    #[arg(
        long,
        allow_hyphen_values = true,
        default_value = "./test_data/int-certificate.der"
    )]
    int_certs: Vec<std::path::PathBuf>,
}

lazy_static! {
    static ref NITRO: Arc<Nitro> = Arc::new({
    // Hit the dev driver when the `dev` feature is enabled
    // You can enable this while working locally, ensuring it's disabled when this service is deployed.
    #[cfg(not(feature = "nitro"))]
    {
        use clap::Parser;
        let args = Args::parse();

        let int_certs = args
            .int_certs
            .into_iter()
            .map(|path| {
                let der = std::fs::read(&path).unwrap();
                ByteBuf::from(der)
            })
            .collect::<Vec<ByteBuf>>();

        let end_cert = {
            let der = std::fs::read(&args.end_cert).unwrap();
            ByteBuf::from(der)
        };

        let signing_key = {
            let der = std::fs::read(&args.signing_key).unwrap();
            SecretKey::from_pkcs8_der(&der).unwrap()
        };

        Nitro::from(nsm_nitro_enclave_utils::driver::dev::DevNitro::builder(signing_key, end_cert)
            // Using `Pcrs::zeros` to get attestation documents similar to how the Nsm module will return all zeros in "debug mode"
            // https://docs.aws.amazon.com/enclaves/latest/user/getting-started.html#run
            // `Pcrs` can be generated in another ways too, but some of them require extra feature flags not enabled in this binary.
            .pcrs(Pcrs::zeros())
            .ca_bundle(int_certs)
            .build())
    }
    #[cfg(feature = "nitro")]
    Nitro::init()
    });
}

#[deno_bindgen]
fn attest(bytes: &[u8]) -> Vec<u8> {
    let buf = ByteBuf::from(bytes);
    let attestation = r_attest(buf);
    attestation
}

fn r_attest(bytes: ByteBuf) -> Vec<u8> {
    let response = NITRO.process_request(Request::Attestation {
        user_data: bytes.into(),
        public_key: None,
        nonce: None,
    });
    if let Response::Attestation { document } = response {
        document
    } else {
        vec![]
    }
}
