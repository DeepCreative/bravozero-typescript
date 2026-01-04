/**
 * Main Bravo Zero Client
 */

import { ConstitutionClient } from './constitution';
import { MemoryClient } from './memory';
import { BridgeClient } from './bridge';
import { PersonaAuthenticator } from './auth';

export interface BravoZeroClientConfig {
  /** API key for authentication */
  apiKey: string;
  /** PERSONA agent identifier */
  agentId: string;
  /** Path to Ed25519 private key for signing */
  privateKeyPath?: string;
  /** Raw private key bytes (alternative to path) */
  privateKey?: Uint8Array;
  /** Override the default API base URL */
  baseUrl?: string;
  /** Environment (production, staging, development) */
  environment?: 'production' | 'staging' | 'development';
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Main client for Bravo Zero Breaking the Limits APIs.
 *
 * @example
 * ```typescript
 * import { BravoZeroClient } from '@bravozero/sdk';
 *
 * const client = new BravoZeroClient({
 *   apiKey: 'your-api-key',
 *   agentId: 'your-agent-id',
 * });
 *
 * // Evaluate an action
 * const result = await client.constitution.evaluate({
 *   action: 'read_file',
 *   context: { path: '/src/main.ts' }
 * });
 *
 * // Store a memory
 * const memory = await client.memory.record({
 *   content: 'User prefers TypeScript',
 *   memoryType: 'semantic'
 * });
 * ```
 */
export class BravoZeroClient {
  private readonly config: Required<Omit<BravoZeroClientConfig, 'privateKeyPath' | 'privateKey'>>;
  private readonly authenticator?: PersonaAuthenticator;
  private _constitution?: ConstitutionClient;
  private _memory?: MemoryClient;
  private _bridge?: BridgeClient;

  constructor(config: BravoZeroClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key required');
    }
    if (!config.agentId) {
      throw new Error('Agent ID required');
    }

    this.config = {
      apiKey: config.apiKey,
      agentId: config.agentId,
      baseUrl: config.baseUrl || this.getBaseUrl(config.environment || 'production'),
      environment: config.environment || 'production',
      timeout: config.timeout || 30000,
    };

    // Initialize authenticator if key provided
    if (config.privateKeyPath || config.privateKey) {
      this.authenticator = new PersonaAuthenticator({
        agentId: config.agentId,
        privateKeyPath: config.privateKeyPath,
        privateKey: config.privateKey,
      });
    }
  }

  private getBaseUrl(environment: string): string {
    const urls: Record<string, string> = {
      production: 'https://api.bravozero.ai',
      staging: 'https://api.staging.bravozero.ai',
      development: 'http://localhost:8080',
    };
    return urls[environment] || urls.production;
  }

  /**
   * Get the Constitution Agent client.
   */
  get constitution(): ConstitutionClient {
    if (!this._constitution) {
      this._constitution = new ConstitutionClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        authenticator: this.authenticator,
        timeout: this.config.timeout,
      });
    }
    return this._constitution;
  }

  /**
   * Get the Memory Service client.
   */
  get memory(): MemoryClient {
    if (!this._memory) {
      this._memory = new MemoryClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        authenticator: this.authenticator,
        timeout: this.config.timeout,
      });
    }
    return this._memory;
  }

  /**
   * Get the Forge Bridge client.
   */
  get bridge(): BridgeClient {
    if (!this._bridge) {
      this._bridge = new BridgeClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        authenticator: this.authenticator,
        timeout: this.config.timeout,
      });
    }
    return this._bridge;
  }
}
