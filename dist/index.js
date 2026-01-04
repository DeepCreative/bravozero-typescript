"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthenticationError: () => AuthenticationError,
  BravoZeroClient: () => BravoZeroClient,
  BravoZeroError: () => BravoZeroError,
  BridgeClient: () => BridgeClient,
  BridgeError: () => BridgeError,
  ConsolidationState: () => ConsolidationState,
  ConstitutionClient: () => ConstitutionClient,
  ConstitutionDeniedError: () => ConstitutionDeniedError,
  Decision: () => Decision,
  MemoryClient: () => MemoryClient,
  MemoryError: () => MemoryError,
  MemoryType: () => MemoryType,
  RateLimitError: () => RateLimitError
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var BravoZeroError = class extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
    this.name = "BravoZeroError";
  }
};
var AuthenticationError = class extends BravoZeroError {
  constructor(message, details) {
    super(message, details);
    this.name = "AuthenticationError";
  }
};
var RateLimitError = class extends BravoZeroError {
  constructor(message, retryAfter = 60, details) {
    super(message, details);
    this.retryAfter = retryAfter;
    this.name = "RateLimitError";
  }
};
var ConstitutionDeniedError = class extends BravoZeroError {
  constructor(reasoning, result, details) {
    super(reasoning, details);
    this.reasoning = reasoning;
    this.result = result;
    this.name = "ConstitutionDeniedError";
  }
};
var MemoryError = class extends BravoZeroError {
  constructor(message, details) {
    super(message, details);
    this.name = "MemoryError";
  }
};
var BridgeError = class extends BravoZeroError {
  constructor(message, details) {
    super(message, details);
    this.name = "BridgeError";
  }
};

// src/types/constitution.ts
var Decision = /* @__PURE__ */ ((Decision2) => {
  Decision2["PERMIT"] = "permit";
  Decision2["DENY"] = "deny";
  Decision2["ESCALATE"] = "escalate";
  return Decision2;
})(Decision || {});

// src/constitution.ts
var ConstitutionClient = class {
  config;
  baseEndpoint;
  constructor(config) {
    this.config = config;
    this.baseEndpoint = `${config.baseUrl}/v1/constitution`;
  }
  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-Agent-ID": this.config.agentId,
      "User-Agent": "bravozero-typescript/1.0.0",
      ...options.headers
    };
    if (this.config.authenticator) {
      headers["X-Persona-Attestation"] = await this.config.authenticator.createAttestation();
    }
    const response = await fetch(`${this.baseEndpoint}${path}`, {
      ...options,
      headers
    });
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("Retry-After") || "60",
        10
      );
      throw new RateLimitError("Rate limit exceeded", retryAfter);
    }
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }
    return response.json();
  }
  /**
   * Evaluate an action against the constitution.
   */
  async evaluate(request) {
    const data = await this.request("/evaluate", {
      method: "POST",
      body: JSON.stringify({
        agentId: this.config.agentId,
        action: request.action,
        context: request.context || {},
        priority: request.priority || "normal"
      })
    });
    const result = {
      requestId: data.requestId,
      decision: data.decision,
      confidence: data.confidence,
      alignmentScore: data.alignmentScore,
      appliedRules: data.appliedRules || [],
      reasoning: data.reasoning || "",
      evaluatedAt: new Date(data.evaluatedAt)
    };
    if (result.decision === "deny" /* DENY */) {
      throw new ConstitutionDeniedError(result.reasoning, result);
    }
    return result;
  }
  /**
   * Get the current global Omega alignment score.
   */
  async getOmega() {
    const data = await this.request("/omega");
    return {
      omega: data.omega,
      components: data.components || {},
      trend: data.trend || "stable",
      timestamp: new Date(data.timestamp)
    };
  }
  /**
   * List constitution rules.
   */
  async listRules(options) {
    const params = new URLSearchParams();
    if (options?.category) params.set("category", options.category);
    if (options?.priority) params.set("priority", options.priority);
    const query = params.toString();
    return this.request(`/rules${query ? `?${query}` : ""}`);
  }
  /**
   * Get a specific rule by ID.
   */
  async getRule(ruleId) {
    return this.request(`/rules/${ruleId}`);
  }
  /**
   * Get the current values database.
   */
  async getValues() {
    return this.request("/values");
  }
};

// src/memory.ts
var MemoryClient = class {
  config;
  baseEndpoint;
  constructor(config) {
    this.config = config;
    this.baseEndpoint = `${config.baseUrl}/v1/memory`;
  }
  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-Agent-ID": this.config.agentId,
      "User-Agent": "bravozero-typescript/1.0.0",
      ...options.headers
    };
    if (this.config.authenticator) {
      headers["X-Persona-Attestation"] = await this.config.authenticator.createAttestation();
    }
    const response = await fetch(`${this.baseEndpoint}${path}`, {
      ...options,
      headers
    });
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("Retry-After") || "60",
        10
      );
      throw new RateLimitError("Rate limit exceeded", retryAfter);
    }
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }
    return response.json();
  }
  parseMemory(data) {
    return {
      id: data.id,
      content: data.content,
      memoryType: data.memoryType,
      importance: data.importance,
      strength: data.strength || 1,
      consolidationState: data.consolidationState || "active",
      namespace: data.namespace,
      tags: data.tags || [],
      createdAt: new Date(data.createdAt),
      lastAccessedAt: new Date(data.lastAccessedAt),
      accessCount: data.accessCount || 0,
      embedding: data.embedding,
      metadata: data.metadata || {}
    };
  }
  /**
   * Record a new memory to the Trace Manifold.
   */
  async record(request) {
    const data = await this.request("/record", {
      method: "POST",
      body: JSON.stringify({
        content: request.content,
        memoryType: request.memoryType || "semantic",
        importance: request.importance || 0.5,
        namespace: request.namespace || this.config.agentId,
        tags: request.tags || [],
        metadata: request.metadata || {}
      })
    });
    return this.parseMemory(data);
  }
  /**
   * Query memories by semantic similarity.
   */
  async query(request) {
    const data = await this.request("/query", {
      method: "POST",
      body: JSON.stringify({
        query: request.query,
        limit: request.limit || 10,
        minRelevance: request.minRelevance || 0.5,
        memoryTypes: request.memoryTypes,
        namespace: request.namespace,
        tags: request.tags
      })
    });
    return (data.results || []).map((r) => ({
      memory: this.parseMemory(r.memory),
      relevance: r.relevance
    }));
  }
  /**
   * Get a specific memory by ID.
   */
  async get(memoryId) {
    const data = await this.request(`/${memoryId}`);
    return this.parseMemory(data);
  }
  /**
   * Update an existing memory.
   */
  async update(memoryId, updates) {
    const data = await this.request(`/${memoryId}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
    return this.parseMemory(data);
  }
  /**
   * Delete a memory.
   */
  async delete(memoryId) {
    await this.request(`/${memoryId}`, { method: "DELETE" });
    return true;
  }
  /**
   * Create an edge between two memories.
   */
  async createEdge(request) {
    const data = await this.request("/edges", {
      method: "POST",
      body: JSON.stringify({
        sourceId: request.sourceId,
        targetId: request.targetId,
        relationship: request.relationship,
        strength: request.strength || 0.5
      })
    });
    return {
      sourceId: data.sourceId,
      targetId: data.targetId,
      relationship: data.relationship,
      strength: data.strength,
      createdAt: new Date(data.createdAt),
      lastStrengthenedAt: new Date(data.lastStrengthenedAt)
    };
  }
  /**
   * Get memories related to a given memory.
   */
  async getRelated(memoryId, options) {
    const params = new URLSearchParams();
    if (options?.relationship) params.set("relationship", options.relationship);
    if (options?.minStrength)
      params.set("minStrength", options.minStrength.toString());
    if (options?.limit) params.set("limit", options.limit.toString());
    const query = params.toString();
    const data = await this.request(
      `/${memoryId}/related${query ? `?${query}` : ""}`
    );
    return (data.results || []).map((r) => ({
      memory: this.parseMemory(r.memory),
      relevance: r.edgeStrength
    }));
  }
};

// src/bridge.ts
var BridgeClient = class {
  config;
  baseEndpoint;
  constructor(config) {
    this.config = config;
    this.baseEndpoint = `${config.baseUrl}/v1/bridge`;
  }
  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-Agent-ID": this.config.agentId,
      "User-Agent": "bravozero-typescript/1.0.0",
      ...options.headers
    };
    if (this.config.authenticator) {
      headers["X-Persona-Attestation"] = await this.config.authenticator.createAttestation();
    }
    const response = await fetch(`${this.baseEndpoint}${path}`, {
      ...options,
      headers
    });
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("Retry-After") || "60",
        10
      );
      throw new RateLimitError("Rate limit exceeded", retryAfter);
    }
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `HTTP ${response.status}`);
    }
    return response.json();
  }
  parseFileInfo(data) {
    return {
      path: data.path,
      name: data.name,
      size: data.size,
      isDirectory: data.isDirectory,
      modifiedAt: new Date(data.modifiedAt),
      createdAt: data.createdAt ? new Date(data.createdAt) : void 0,
      permissions: data.permissions || ""
    };
  }
  /**
   * List files in a directory.
   */
  async listFiles(path, options) {
    const params = new URLSearchParams({ path });
    if (options?.recursive) params.set("recursive", "true");
    if (options?.pattern) params.set("pattern", options.pattern);
    const data = await this.request(`/files?${params}`);
    return {
      path: data.path,
      files: (data.files || []).map((f) => this.parseFileInfo(f)),
      totalCount: data.totalCount || data.files?.length || 0
    };
  }
  /**
   * Read a file's contents.
   */
  async readFile(path) {
    const params = new URLSearchParams({ path });
    const data = await this.request(`/file?${params}`);
    return data.content;
  }
  /**
   * Read a file as bytes.
   */
  async readFileBytes(path) {
    const headers = {
      Accept: "application/octet-stream",
      "X-API-Key": this.config.apiKey,
      "X-Agent-ID": this.config.agentId
    };
    if (this.config.authenticator) {
      headers["X-Persona-Attestation"] = await this.config.authenticator.createAttestation();
    }
    const params = new URLSearchParams({ path });
    const response = await fetch(`${this.baseEndpoint}/file/bytes?${params}`, {
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.arrayBuffer();
  }
  /**
   * Write content to a file.
   */
  async writeFile(path, content, options) {
    const data = await this.request("/file", {
      method: "PUT",
      body: JSON.stringify({
        path,
        content,
        createDirs: options?.createDirs ?? true
      })
    });
    return this.parseFileInfo(data);
  }
  /**
   * Delete a file.
   */
  async deleteFile(path) {
    const params = new URLSearchParams({ path });
    await this.request(`/file?${params}`, { method: "DELETE" });
    return true;
  }
  /**
   * Get information about a file.
   */
  async getFileInfo(path) {
    const params = new URLSearchParams({ path });
    const data = await this.request(`/file/info?${params}`);
    return this.parseFileInfo(data);
  }
  /**
   * Trigger VFS synchronization.
   */
  async sync(path = "/") {
    const data = await this.request("/sync", {
      method: "POST",
      body: JSON.stringify({ path })
    });
    return {
      path: data.path,
      synced: data.synced,
      lastSyncAt: data.lastSyncAt ? new Date(data.lastSyncAt) : void 0,
      pendingChanges: data.pendingChanges || 0
    };
  }
  /**
   * Get current sync status.
   */
  async getSyncStatus(path = "/") {
    const params = new URLSearchParams({ path });
    const data = await this.request(`/sync/status?${params}`);
    return {
      path: data.path,
      synced: data.synced,
      lastSyncAt: data.lastSyncAt ? new Date(data.lastSyncAt) : void 0,
      pendingChanges: data.pendingChanges || 0
    };
  }
};

// src/auth.ts
var ed = __toESM(require("@noble/ed25519"));
var import_fs = require("fs");
var PersonaAuthenticator = class {
  agentId;
  privateKey;
  constructor(config) {
    this.agentId = config.agentId;
    if (config.privateKey) {
      this.privateKey = config.privateKey;
    } else if (config.privateKeyPath) {
      this.privateKey = this.loadPrivateKey(config.privateKeyPath);
    } else {
      throw new Error("Either privateKeyPath or privateKey required");
    }
  }
  loadPrivateKey(path) {
    const pemContent = (0, import_fs.readFileSync)(path, "utf-8");
    const matches = pemContent.match(
      /-----BEGIN PRIVATE KEY-----\s*([\s\S]*?)\s*-----END PRIVATE KEY-----/
    );
    if (!matches) {
      throw new Error(`Invalid PEM file: ${path}`);
    }
    const base64 = matches[1].replace(/\s/g, "");
    const der = Buffer.from(base64, "base64");
    return new Uint8Array(der.slice(-32));
  }
  /**
   * Create a signed PERSONA attestation.
   */
  async createAttestation(action) {
    const timestamp = Math.floor(Date.now() / 1e3);
    const payload = {
      agent_id: this.agentId,
      timestamp,
      nonce: `${timestamp}-${Math.random().toString(36).slice(2)}`,
      ...action && { action }
    };
    const payloadBytes = new TextEncoder().encode(
      JSON.stringify(payload, Object.keys(payload).sort())
    );
    const signature = await ed.signAsync(payloadBytes, this.privateKey);
    const attestation = {
      payload: Buffer.from(payloadBytes).toString("base64"),
      signature: Buffer.from(signature).toString("base64"),
      algorithm: "Ed25519"
    };
    return Buffer.from(JSON.stringify(attestation)).toString("base64");
  }
  /**
   * Get the public key as base64.
   */
  async getPublicKey() {
    const publicKey = await ed.getPublicKeyAsync(this.privateKey);
    return Buffer.from(publicKey).toString("base64");
  }
};

// src/client.ts
var BravoZeroClient = class {
  config;
  authenticator;
  _constitution;
  _memory;
  _bridge;
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("API key required");
    }
    if (!config.agentId) {
      throw new Error("Agent ID required");
    }
    this.config = {
      apiKey: config.apiKey,
      agentId: config.agentId,
      baseUrl: config.baseUrl || this.getBaseUrl(config.environment || "production"),
      environment: config.environment || "production",
      timeout: config.timeout || 3e4
    };
    if (config.privateKeyPath || config.privateKey) {
      this.authenticator = new PersonaAuthenticator({
        agentId: config.agentId,
        privateKeyPath: config.privateKeyPath,
        privateKey: config.privateKey
      });
    }
  }
  getBaseUrl(environment) {
    const urls = {
      production: "https://api.bravozero.ai",
      staging: "https://api.staging.bravozero.ai",
      development: "http://localhost:8080"
    };
    return urls[environment] || urls.production;
  }
  /**
   * Get the Constitution Agent client.
   */
  get constitution() {
    if (!this._constitution) {
      this._constitution = new ConstitutionClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        authenticator: this.authenticator,
        timeout: this.config.timeout
      });
    }
    return this._constitution;
  }
  /**
   * Get the Memory Service client.
   */
  get memory() {
    if (!this._memory) {
      this._memory = new MemoryClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        authenticator: this.authenticator,
        timeout: this.config.timeout
      });
    }
    return this._memory;
  }
  /**
   * Get the Forge Bridge client.
   */
  get bridge() {
    if (!this._bridge) {
      this._bridge = new BridgeClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        agentId: this.config.agentId,
        authenticator: this.authenticator,
        timeout: this.config.timeout
      });
    }
    return this._bridge;
  }
};

// src/types/memory.ts
var MemoryType = /* @__PURE__ */ ((MemoryType2) => {
  MemoryType2["EPISODIC"] = "episodic";
  MemoryType2["SEMANTIC"] = "semantic";
  MemoryType2["PROCEDURAL"] = "procedural";
  MemoryType2["WORKING"] = "working";
  return MemoryType2;
})(MemoryType || {});
var ConsolidationState = /* @__PURE__ */ ((ConsolidationState2) => {
  ConsolidationState2["ACTIVE"] = "active";
  ConsolidationState2["CONSOLIDATING"] = "consolidating";
  ConsolidationState2["CONSOLIDATED"] = "consolidated";
  ConsolidationState2["DECAYING"] = "decaying";
  ConsolidationState2["DORMANT"] = "dormant";
  return ConsolidationState2;
})(ConsolidationState || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  BravoZeroClient,
  BravoZeroError,
  BridgeClient,
  BridgeError,
  ConsolidationState,
  ConstitutionClient,
  ConstitutionDeniedError,
  Decision,
  MemoryClient,
  MemoryError,
  MemoryType,
  RateLimitError
});
