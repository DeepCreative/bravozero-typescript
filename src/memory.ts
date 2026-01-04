/**
 * Memory Service Client
 */

import { PersonaAuthenticator } from './auth';
import { RateLimitError } from './errors';
import {
  Memory,
  MemoryQueryResult,
  Edge,
  RecordRequest,
  QueryRequest,
  MemoryType,
  ConsolidationState,
} from './types/memory';

interface MemoryClientConfig {
  baseUrl: string;
  apiKey: string;
  agentId: string;
  authenticator?: PersonaAuthenticator;
  timeout: number;
}

/**
 * Client for the Memory Service API.
 */
export class MemoryClient {
  private readonly config: MemoryClientConfig;
  private readonly baseEndpoint: string;

  constructor(config: MemoryClientConfig) {
    this.config = config;
    this.baseEndpoint = `${config.baseUrl}/v1/memory`;
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
      const errorBody = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private parseMemory(data: any): Memory {
    return {
      id: data.id,
      content: data.content,
      memoryType: data.memoryType as MemoryType,
      importance: data.importance,
      strength: data.strength || 1.0,
      consolidationState: (data.consolidationState ||
        'active') as ConsolidationState,
      namespace: data.namespace,
      tags: data.tags || [],
      createdAt: new Date(data.createdAt),
      lastAccessedAt: new Date(data.lastAccessedAt),
      accessCount: data.accessCount || 0,
      embedding: data.embedding,
      metadata: data.metadata || {},
    };
  }

  /**
   * Record a new memory to the Trace Manifold.
   */
  async record(request: RecordRequest): Promise<Memory> {
    const data = await this.request<any>('/record', {
      method: 'POST',
      body: JSON.stringify({
        content: request.content,
        memoryType: request.memoryType || 'semantic',
        importance: request.importance || 0.5,
        namespace: request.namespace || this.config.agentId,
        tags: request.tags || [],
        metadata: request.metadata || {},
      }),
    });

    return this.parseMemory(data);
  }

  /**
   * Query memories by semantic similarity.
   */
  async query(request: QueryRequest): Promise<MemoryQueryResult[]> {
    const data = await this.request<any>('/query', {
      method: 'POST',
      body: JSON.stringify({
        query: request.query,
        limit: request.limit || 10,
        minRelevance: request.minRelevance || 0.5,
        memoryTypes: request.memoryTypes,
        namespace: request.namespace,
        tags: request.tags,
      }),
    });

    return (data.results || []).map((r: any) => ({
      memory: this.parseMemory(r.memory),
      relevance: r.relevance,
    }));
  }

  /**
   * Get a specific memory by ID.
   */
  async get(memoryId: string): Promise<Memory> {
    const data = await this.request<any>(`/${memoryId}`);
    return this.parseMemory(data);
  }

  /**
   * Update an existing memory.
   */
  async update(
    memoryId: string,
    updates: {
      content?: string;
      importance?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<Memory> {
    const data = await this.request<any>(`/${memoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return this.parseMemory(data);
  }

  /**
   * Delete a memory.
   */
  async delete(memoryId: string): Promise<boolean> {
    await this.request(`/${memoryId}`, { method: 'DELETE' });
    return true;
  }

  /**
   * Create an edge between two memories.
   */
  async createEdge(request: {
    sourceId: string;
    targetId: string;
    relationship: string;
    strength?: number;
  }): Promise<Edge> {
    const data = await this.request<any>('/edges', {
      method: 'POST',
      body: JSON.stringify({
        sourceId: request.sourceId,
        targetId: request.targetId,
        relationship: request.relationship,
        strength: request.strength || 0.5,
      }),
    });

    return {
      sourceId: data.sourceId,
      targetId: data.targetId,
      relationship: data.relationship,
      strength: data.strength,
      createdAt: new Date(data.createdAt),
      lastStrengthenedAt: new Date(data.lastStrengthenedAt),
    };
  }

  /**
   * Get memories related to a given memory.
   */
  async getRelated(
    memoryId: string,
    options?: {
      relationship?: string;
      minStrength?: number;
      limit?: number;
    }
  ): Promise<MemoryQueryResult[]> {
    const params = new URLSearchParams();
    if (options?.relationship) params.set('relationship', options.relationship);
    if (options?.minStrength)
      params.set('minStrength', options.minStrength.toString());
    if (options?.limit) params.set('limit', options.limit.toString());

    const query = params.toString();
    const data = await this.request<any>(
      `/${memoryId}/related${query ? `?${query}` : ''}`
    );

    return (data.results || []).map((r: any) => ({
      memory: this.parseMemory(r.memory),
      relevance: r.edgeStrength,
    }));
  }
}
