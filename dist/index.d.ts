/**
 * PERSONA Authentication
 */
interface PersonaAuthenticatorConfig {
    agentId: string;
    privateKeyPath?: string;
    privateKey?: Uint8Array;
}
/**
 * PERSONA authenticator for signing attestations.
 */
declare class PersonaAuthenticator {
    private readonly agentId;
    private readonly privateKey;
    constructor(config: PersonaAuthenticatorConfig);
    private loadPrivateKey;
    /**
     * Create a signed PERSONA attestation.
     */
    createAttestation(action?: string): Promise<string>;
    /**
     * Get the public key as base64.
     */
    getPublicKey(): Promise<string>;
}

/**
 * Constitution Agent Types
 */
declare enum Decision {
    PERMIT = "permit",
    DENY = "deny",
    ESCALATE = "escalate"
}
interface AppliedRule {
    ruleId: string;
    name: string;
    matched: boolean;
    contribution: number;
}
interface EvaluationResult {
    requestId: string;
    decision: Decision;
    confidence: number;
    alignmentScore: number;
    appliedRules: AppliedRule[];
    reasoning: string;
    evaluatedAt: Date;
}
interface EvaluateRequest {
    action: string;
    context?: Record<string, any>;
    priority?: 'normal' | 'high' | 'critical';
}
interface OmegaScore {
    omega: number;
    components: Record<string, number>;
    trend: 'improving' | 'stable' | 'degrading';
    timestamp: Date;
}
interface Rule {
    id: string;
    name: string;
    description: string;
    category: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    condition: string;
    action: 'permit' | 'deny' | 'escalate';
    active: boolean;
}
interface ValuesDatabase {
    version: string;
    values: Record<string, any>;
    lastUpdated: Date;
}

/**
 * Constitution Agent Client
 */

interface ConstitutionClientConfig {
    baseUrl: string;
    apiKey: string;
    agentId: string;
    authenticator?: PersonaAuthenticator;
    timeout: number;
}
/**
 * Client for the Constitution Agent API.
 */
declare class ConstitutionClient {
    private readonly config;
    private readonly baseEndpoint;
    constructor(config: ConstitutionClientConfig);
    private request;
    /**
     * Evaluate an action against the constitution.
     */
    evaluate(request: EvaluateRequest): Promise<EvaluationResult>;
    /**
     * Get the current global Omega alignment score.
     */
    getOmega(): Promise<OmegaScore>;
    /**
     * List constitution rules.
     */
    listRules(options?: {
        category?: string;
        priority?: string;
    }): Promise<Rule[]>;
    /**
     * Get a specific rule by ID.
     */
    getRule(ruleId: string): Promise<Rule>;
    /**
     * Get the current values database.
     */
    getValues(): Promise<ValuesDatabase>;
}

/**
 * Memory Service Types
 */
declare enum MemoryType {
    EPISODIC = "episodic",
    SEMANTIC = "semantic",
    PROCEDURAL = "procedural",
    WORKING = "working"
}
declare enum ConsolidationState {
    ACTIVE = "active",
    CONSOLIDATING = "consolidating",
    CONSOLIDATED = "consolidated",
    DECAYING = "decaying",
    DORMANT = "dormant"
}
interface Memory {
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
interface MemoryQueryResult {
    memory: Memory;
    relevance: number;
}
interface Edge {
    sourceId: string;
    targetId: string;
    relationship: string;
    strength: number;
    createdAt: Date;
    lastStrengthenedAt: Date;
}
interface RecordRequest {
    content: string;
    memoryType?: MemoryType | string;
    importance?: number;
    namespace?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}
interface QueryRequest {
    query: string;
    limit?: number;
    minRelevance?: number;
    memoryTypes?: (MemoryType | string)[];
    namespace?: string;
    tags?: string[];
}

/**
 * Memory Service Client
 */

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
declare class MemoryClient {
    private readonly config;
    private readonly baseEndpoint;
    constructor(config: MemoryClientConfig);
    private request;
    private parseMemory;
    /**
     * Record a new memory to the Trace Manifold.
     */
    record(request: RecordRequest): Promise<Memory>;
    /**
     * Query memories by semantic similarity.
     */
    query(request: QueryRequest): Promise<MemoryQueryResult[]>;
    /**
     * Get a specific memory by ID.
     */
    get(memoryId: string): Promise<Memory>;
    /**
     * Update an existing memory.
     */
    update(memoryId: string, updates: {
        content?: string;
        importance?: number;
        tags?: string[];
        metadata?: Record<string, any>;
    }): Promise<Memory>;
    /**
     * Delete a memory.
     */
    delete(memoryId: string): Promise<boolean>;
    /**
     * Create an edge between two memories.
     */
    createEdge(request: {
        sourceId: string;
        targetId: string;
        relationship: string;
        strength?: number;
    }): Promise<Edge>;
    /**
     * Get memories related to a given memory.
     */
    getRelated(memoryId: string, options?: {
        relationship?: string;
        minStrength?: number;
        limit?: number;
    }): Promise<MemoryQueryResult[]>;
}

/**
 * Forge Bridge Types
 */
interface FileInfo {
    path: string;
    name: string;
    size: number;
    isDirectory: boolean;
    modifiedAt: Date;
    createdAt?: Date;
    permissions: string;
}
interface DirectoryListing {
    path: string;
    files: FileInfo[];
    totalCount: number;
}
interface SyncStatus {
    path: string;
    synced: boolean;
    lastSyncAt?: Date;
    pendingChanges: number;
}

/**
 * Forge Bridge Client
 */

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
declare class BridgeClient {
    private readonly config;
    private readonly baseEndpoint;
    constructor(config: BridgeClientConfig);
    private request;
    private parseFileInfo;
    /**
     * List files in a directory.
     */
    listFiles(path: string, options?: {
        recursive?: boolean;
        pattern?: string;
    }): Promise<DirectoryListing>;
    /**
     * Read a file's contents.
     */
    readFile(path: string): Promise<string>;
    /**
     * Read a file as bytes.
     */
    readFileBytes(path: string): Promise<ArrayBuffer>;
    /**
     * Write content to a file.
     */
    writeFile(path: string, content: string, options?: {
        createDirs?: boolean;
    }): Promise<FileInfo>;
    /**
     * Delete a file.
     */
    deleteFile(path: string): Promise<boolean>;
    /**
     * Get information about a file.
     */
    getFileInfo(path: string): Promise<FileInfo>;
    /**
     * Trigger VFS synchronization.
     */
    sync(path?: string): Promise<SyncStatus>;
    /**
     * Get current sync status.
     */
    getSyncStatus(path?: string): Promise<SyncStatus>;
}

/**
 * Main Bravo Zero Client
 */

interface BravoZeroClientConfig {
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
declare class BravoZeroClient {
    private readonly config;
    private readonly authenticator?;
    private _constitution?;
    private _memory?;
    private _bridge?;
    constructor(config: BravoZeroClientConfig);
    private getBaseUrl;
    /**
     * Get the Constitution Agent client.
     */
    get constitution(): ConstitutionClient;
    /**
     * Get the Memory Service client.
     */
    get memory(): MemoryClient;
    /**
     * Get the Forge Bridge client.
     */
    get bridge(): BridgeClient;
}

/**
 * Bravo Zero SDK Errors
 */
declare class BravoZeroError extends Error {
    readonly details?: Record<string, any> | undefined;
    constructor(message: string, details?: Record<string, any> | undefined);
}
declare class AuthenticationError extends BravoZeroError {
    constructor(message: string, details?: Record<string, any>);
}
declare class RateLimitError extends BravoZeroError {
    readonly retryAfter: number;
    constructor(message: string, retryAfter?: number, details?: Record<string, any>);
}
declare class ConstitutionDeniedError extends BravoZeroError {
    readonly reasoning: string;
    readonly result?: any | undefined;
    constructor(reasoning: string, result?: any | undefined, details?: Record<string, any>);
}
declare class MemoryError extends BravoZeroError {
    constructor(message: string, details?: Record<string, any>);
}
declare class BridgeError extends BravoZeroError {
    constructor(message: string, details?: Record<string, any>);
}

export { type AppliedRule, AuthenticationError, BravoZeroClient, type BravoZeroClientConfig, BravoZeroError, BridgeClient, BridgeError, ConsolidationState, ConstitutionClient, ConstitutionDeniedError, Decision, type DirectoryListing, type Edge, type EvaluationResult, type FileInfo, type Memory, MemoryClient, MemoryError, type MemoryQueryResult, MemoryType, type OmegaScore, RateLimitError, type SyncStatus };
