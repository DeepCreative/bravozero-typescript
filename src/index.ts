/**
 * Bravo Zero TypeScript SDK
 *
 * Official SDK for interacting with Breaking the Limits APIs:
 * - Constitution Agent: Governance and alignment enforcement
 * - Memory Service: Trace Manifold persistent memory
 * - Forge Bridge: VFS and repository access
 */

export { BravoZeroClient, type BravoZeroClientConfig } from './client';
export { ConstitutionClient } from './constitution';
export { MemoryClient } from './memory';
export { BridgeClient } from './bridge';

export {
  type EvaluationResult,
  type AppliedRule,
  type OmegaScore,
  Decision,
} from './types/constitution';

export {
  type Memory,
  type MemoryQueryResult,
  type Edge,
  MemoryType,
  ConsolidationState,
} from './types/memory';

export {
  type FileInfo,
  type DirectoryListing,
  type SyncStatus,
} from './types/bridge';

export {
  BravoZeroError,
  AuthenticationError,
  RateLimitError,
  ConstitutionDeniedError,
  MemoryError,
  BridgeError,
} from './errors';