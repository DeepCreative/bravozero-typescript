/**
 * Memory Service Types
 */

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
}

export enum ConsolidationState {
  ACTIVE = 'active',
  CONSOLIDATING = 'consolidating',
  CONSOLIDATED = 'consolidated',
  DECAYING = 'decaying',
  DORMANT = 'dormant',
}

export interface Memory {
  id: string;
  content: string;
  memoryType: MemoryType;
  importance: number;
  strength: number;
  consolidationState: ConsolidationState;
  namespace: string;
  tags: string[];
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface MemoryQueryResult {
  memory: Memory;
  relevance: number;
}

export interface Edge {
  sourceId: string;
  targetId: string;
  relationship: string;
  strength: number;
  createdAt: Date;
  lastStrengthenedAt: Date;
}

export interface RecordRequest {
  content: string;
  memoryType?: MemoryType | string;
  importance?: number;
  namespace?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface QueryRequest {
  query: string;
  limit?: number;
  minRelevance?: number;
  memoryTypes?: (MemoryType | string)[];
  namespace?: string;
  tags?: string[];
}

