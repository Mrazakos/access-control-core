import * as crypto from "crypto";
import { KeyPair, VerifiableCredential } from "./types";

/**
 * Utility class for cryptographic operations
 */
export class CryptoUtils {
  /**
   * Generates a simple key pair
   * @returns A newly generated RSA key pair
   */
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return {
      privateKey,
      publicKey,
    };
  }

  /**
   * Signs data with a private key
   * Can input an object (will stringify), hash it, then sign
   */
  static sign(
    data: string | object,
    privateKey: string
  ): Partial<VerifiableCredential> {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    const dataHash = crypto.createHash("sha256").update(dataString).digest();

    return {
      signature: crypto
        .sign("sha256", dataHash, {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        })
        .toString("base64"),
      userMetaDataHash: dataHash.toString("base64"),
    };
  }

  /**
   * Verifies a digital signature
   */
  static verify(
    dataHash: string,
    signature: string,
    publicKey: string
  ): boolean {
    return crypto.verify(
      "sha256",
      Buffer.from(dataHash, "base64"),
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      },
      Buffer.from(signature, "base64")
    );
  }

  /**
   * Generates a random address
   */
  static generateAddress(): string {
    return "addr_" + crypto.randomBytes(20).toString("base64");
  }

  /**
   * Generates a random number for IDs
   */
  static generateId(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
