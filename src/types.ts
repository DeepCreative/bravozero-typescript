/**
 * Bravo Zero SDK Types
 */

// Constitution Types

export type Decision = 'permit' | 'deny' | 'escalate';

export type Priority = 'normal' | 'high' | 'critical';

export interface EvaluationRequest {
  /** Action to evaluate */
  action: string;
  /** Additional context for evaluation */
  context?: Record<string, unknown>;
  /** Request priority level */
  priority?: Priority;
}

export interface AppliedRule {
  ruleId: string;
  name: string;
  matched: boolean;
  contribution: number;
}

export interface EvaluationResult {
  requestId: string;
  decision: Decision;
  confidence: number;
  alignmentScore: number;
  appliedRules: AppliedRule[];
  reasoning: string;
  evaluatedAt: Date;
}

export interface OmegaScore {
  omega: number;
  components: Record<string, number>;
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: Date;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  condition: string;
  action: Decision;
  active: boolean;
}

// Memory Types

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';

export interface Memory {
  id: string;
  content: string;
  memoryType: MemoryType;
  importance: number;
  tags: string[];
  namespace: string;
  createdAt: Date;
  accessedAt: Date;
  accessCount: number;
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface RecordRequest {
  content: string;
  memoryType?: MemoryType;
  importance?: number;
  tags?: string[];
  namespace?: string;
  metadata?: Record<string, unknown>;
}

export interface QueryRequest {
  query: string;
  limit?: number;
  minRelevance?: number;
  memoryTypes?: MemoryType[];
  tags?: string[];
  namespace?: string;
}

export interface QueryMatch {
  memory: Memory;
  relevance: number;
  highlights: string[];
}

export interface QueryResult {
  matches: QueryMatch[];
  totalCount: number;
  queryTimeMs: number;
}

// Bridge Types

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: Date;
  contentType?: string;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  totalCount: number;
}

// Client Options

export interface ClientOptions {
  /** API key for authentication */
  apiKey?: string;
  /** Agent ID for PERSONA attestation */
  agentId?: string;
  /** Path to Ed25519 private key */
  privateKeyPath?: string;
  /** Base URL for the API */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

// Health Types

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: Record<string, boolean>;
}

