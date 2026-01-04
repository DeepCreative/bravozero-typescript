/**
 * Constitution Agent Client
 */

import { PersonaAuthenticator } from './auth';
import { RateLimitError, ConstitutionDeniedError } from './errors';
import {
  EvaluationResult,
  EvaluateRequest,
  OmegaScore,
  Decision,
  Rule,
  ValuesDatabase,
} from './types/constitution';

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
export class ConstitutionClient {
  private readonly config: ConstitutionClientConfig;
  private readonly baseEndpoint: string;

  constructor(config: ConstitutionClientConfig) {
    this.config = config;
    this.baseEndpoint = `${config.baseUrl}/v1/constitution`;
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

  /**
   * Evaluate an action against the constitution.
   */
  async evaluate(request: EvaluateRequest): Promise<EvaluationResult> {
    const data = await this.request<any>('/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        agentId: this.config.agentId,
        action: request.action,
        context: request.context || {},
        priority: request.priority || 'normal',
      }),
    });

    const result: EvaluationResult = {
      requestId: data.requestId,
      decision: data.decision as Decision,
      confidence: data.confidence,
      alignmentScore: data.alignmentScore,
      appliedRules: data.appliedRules || [],
      reasoning: data.reasoning || '',
      evaluatedAt: new Date(data.evaluatedAt),
    };

    if (result.decision === Decision.DENY) {
      throw new ConstitutionDeniedError(result.reasoning, result);
    }

    return result;
  }

  /**
   * Get the current global Omega alignment score.
   */
  async getOmega(): Promise<OmegaScore> {
    const data = await this.request<any>('/omega');

    return {
      omega: data.omega,
      components: data.components || {},
      trend: data.trend || 'stable',
      timestamp: new Date(data.timestamp),
    };
  }

  /**
   * List constitution rules.
   */
  async listRules(options?: {
    category?: string;
    priority?: string;
  }): Promise<Rule[]> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.priority) params.set('priority', options.priority);

    const query = params.toString();
    return this.request<Rule[]>(`/rules${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific rule by ID.
   */
  async getRule(ruleId: string): Promise<Rule> {
    return this.request<Rule>(`/rules/${ruleId}`);
  }

  /**
   * Get the current values database.
   */
  async getValues(): Promise<ValuesDatabase> {
    return this.request<ValuesDatabase>('/values');
  }
}
