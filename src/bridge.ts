/**
 * Forge Bridge Client
 */

import { PersonaAuthenticator } from './auth';
import { RateLimitError } from './errors';
import { FileInfo, DirectoryListing, SyncStatus } from './types/bridge';

interface BridgeClientConfig {
  baseUrl: string;
  apiKey: string;
  agentId: string;
  authenticator?: PersonaAuthenticator;
  timeout: number;
}

/**
 * Client for the Forge Bridge API.
 */
export class BridgeClient {
  private readonly config: BridgeClientConfig;
  private readonly baseEndpoint: string;

  constructor(config: BridgeClientConfig) {
    this.config = config;
    this.baseEndpoint = `${config.baseUrl}/v1/bridge`;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Agent-ID': this.config.agentId,
      'User-Agent': 'bravozero-typescript/1.0.0',
      ...(options.headers as Record<string, string>),
    };

    if (this.config.authenticator) {
      headers['X-Persona-Attestation'] =
        await this.config.authenticator.createAttestation();
    }

    const response = await fetch(`${this.baseEndpoint}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get('Retry-After') || '60',
        10
      );
      throw new RateLimitError('Rate limit exceeded', retryAfter);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private parseFileInfo(data: any): FileInfo {
    return {
      path: data.path,
      name: data.name,
      size: data.size,
      isDirectory: data.isDirectory,
      modifiedAt: new Date(data.modifiedAt),
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      permissions: data.permissions || '',
    };
  }

  /**
   * List files in a directory.
   */
  async listFiles(
    path: string,
    options?: {
      recursive?: boolean;
      pattern?: string;
    }
  ): Promise<DirectoryListing> {
    const params = new URLSearchParams({ path });
    if (options?.recursive) params.set('recursive', 'true');
    if (options?.pattern) params.set('pattern', options.pattern);

    const data = await this.request<any>(`/files?${params}`);

    return {
      path: data.path,
      files: (data.files || []).map((f: any) => this.parseFileInfo(f)),
      totalCount: data.totalCount || data.files?.length || 0,
    };
  }

  /**
   * Read a file's contents.
   */
  async readFile(path: string): Promise<string> {
    const params = new URLSearchParams({ path });
    const data = await this.request<any>(`/file?${params}`);
    return data.content;
  }

  /**
   * Read a file as bytes.
   */
  async readFileBytes(path: string): Promise<ArrayBuffer> {
    const headers: Record<string, string> = {
      Accept: 'application/octet-stream',
      'X-API-Key': this.config.apiKey,
      'X-Agent-ID': this.config.agentId,
    };

    if (this.config.authenticator) {
      headers['X-Persona-Attestation'] =
        await this.config.authenticator.createAttestation();
    }

    const params = new URLSearchParams({ path });
    const response = await fetch(`${this.baseEndpoint}/file/bytes?${params}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Write content to a file.
   */
  async writeFile(
    path: string,
    content: string,
    options?: { createDirs?: boolean }
  ): Promise<FileInfo> {
    const data = await this.request<any>('/file', {
      method: 'PUT',
      body: JSON.stringify({
        path,
        content,
        createDirs: options?.createDirs ?? true,
      }),
    });

    return this.parseFileInfo(data);
  }

  /**
   * Delete a file.
   */
  async deleteFile(path: string): Promise<boolean> {
    const params = new URLSearchParams({ path });
    await this.request(`/file?${params}`, { method: 'DELETE' });
    return true;
  }

  /**
   * Get information about a file.
   */
  async getFileInfo(path: string): Promise<FileInfo> {
    const params = new URLSearchParams({ path });
    const data = await this.request<any>(`/file/info?${params}`);
    return this.parseFileInfo(data);
  }

  /**
   * Trigger VFS synchronization.
   */
  async sync(path: string = '/'): Promise<SyncStatus> {
    const data = await this.request<any>('/sync', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });

    return {
      path: data.path,
      synced: data.synced,
      lastSyncAt: data.lastSyncAt ? new Date(data.lastSyncAt) : undefined,
      pendingChanges: data.pendingChanges || 0,
    };
  }

  /**
   * Get current sync status.
   */
  async getSyncStatus(path: string = '/'): Promise<SyncStatus> {
    const params = new URLSearchParams({ path });
    const data = await this.request<any>(`/sync/status?${params}`);

    return {
      path: data.path,
      synced: data.synced,
      lastSyncAt: data.lastSyncAt ? new Date(data.lastSyncAt) : undefined,
      pendingChanges: data.pendingChanges || 0,
    };
  }
}
