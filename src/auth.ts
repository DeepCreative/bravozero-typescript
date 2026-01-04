/**
 * PERSONA Authentication
 */

import * as ed from '@noble/ed25519';
import { readFileSync } from 'fs';

interface PersonaAuthenticatorConfig {
  agentId: string;
  privateKeyPath?: string;
  privateKey?: Uint8Array;
}

/**
 * PERSONA authenticator for signing attestations.
 */
export class PersonaAuthenticator {
  private readonly agentId: string;
  private readonly privateKey: Uint8Array;

  constructor(config: PersonaAuthenticatorConfig) {
    this.agentId = config.agentId;

    if (config.privateKey) {
      this.privateKey = config.privateKey;
    } else if (config.privateKeyPath) {
      this.privateKey = this.loadPrivateKey(config.privateKeyPath);
    } else {
      throw new Error('Either privateKeyPath or privateKey required');
    }
  }

  private loadPrivateKey(path: string): Uint8Array {
    const pemContent = readFileSync(path, 'utf-8');
    
    // Extract the base64 content between PEM headers
    const matches = pemContent.match(
      /-----BEGIN PRIVATE KEY-----\s*([\s\S]*?)\s*-----END PRIVATE KEY-----/
    );
    
    if (!matches) {
      throw new Error(`Invalid PEM file: ${path}`);
    }
    
    const base64 = matches[1].replace(/\s/g, '');
    const der = Buffer.from(base64, 'base64');
    
    // Ed25519 private key is last 32 bytes of DER
    return new Uint8Array(der.slice(-32));
  }

  /**
   * Create a signed PERSONA attestation.
   */
  async createAttestation(action?: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    
    const payload = {
      agent_id: this.agentId,
      timestamp,
      nonce: `${timestamp}-${Math.random().toString(36).slice(2)}`,
      ...(action && { action }),
    };
    
    const payloadBytes = new TextEncoder().encode(
      JSON.stringify(payload, Object.keys(payload).sort())
    );
    
    // Sign with Ed25519
    const signature = await ed.signAsync(payloadBytes, this.privateKey);
    
    // Build attestation
    const attestation = {
      payload: Buffer.from(payloadBytes).toString('base64'),
      signature: Buffer.from(signature).toString('base64'),
      algorithm: 'Ed25519',
    };
    
    return Buffer.from(JSON.stringify(attestation)).toString('base64');
  }

  /**
   * Get the public key as base64.
   */
  async getPublicKey(): Promise<string> {
    const publicKey = await ed.getPublicKeyAsync(this.privateKey);
    return Buffer.from(publicKey).toString('base64');
  }
}

