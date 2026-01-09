/**
 * Constitution Agent Types
 */

export enum Decision {
  PERMIT = 'permit',
  DENY = 'deny',
  ESCALATE = 'escalate',
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

export interface EvaluateRequest {
  action: string;
  context?: Record<string, any>;
  priority?: 'normal' | 'high' | 'critical';
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
  priority: 'critical' | 'high' | 'medium' | 'low';
  condition: string;
  action: 'permit' | 'deny' | 'escalate';
  active: boolean;
}

export interface ValuesDatabase {
  version: string;
  values: Record<string, any>;
  lastUpdated: Date;
}



