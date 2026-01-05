# Bravo Zero TypeScript SDK

Official TypeScript SDK for the Bravo Zero Breaking the Limits platform.

## Installation

```bash
npm install @bravozero/sdk
```

## Quick Start

```typescript
import { BravoZeroClient } from '@bravozero/sdk';

const client = new BravoZeroClient({
  apiKey: 'your-api-key'
});

// Check system health
const health = await client.governance.getHealth();
console.log(`System: ${health.state}, Omega: ${health.omega_score}`);
```

## Governance Examples

### Evaluate Actions

```typescript
// Evaluate an action against the constitution
const result = await client.governance.evaluate({
  agentId: 'agent-123',
  action: 'Generate a summary of the user document',
  context: { userId: 'user-456' }
});

switch (result.decision) {
  case 'allow':
    console.log('Action allowed!');
    await performAction();
    break;
  case 'deny':
    console.log(`Denied: ${result.reasoning}`);
    break;
  case 'escalate':
    console.log('Requires human review');
    await requestApproval(result);
    break;
}
```

### Monitor Omega Score

```typescript
// Get current system alignment
const omega = await client.governance.getOmega();
console.log(`Omega Score: ${omega.omega.toFixed(2)}`);
console.log(`Trend: ${omega.trend}`);

for (const [name, score] of Object.entries(omega.components)) {
  console.log(`  ${name}: ${score.toFixed(2)}`);
}
```

### Submit Governance Proposals

```typescript
// Submit a proposal for new rule
const proposal = await client.governance.submitProposal({
  title: 'Add data retention rule',
  description: 'Require agents to respect data retention preferences',
  category: 'rule'
});

console.log(`Proposal ${proposal.proposal_id} submitted`);
console.log(`Voting ends: ${proposal.voting_ends_at}`);
```

### Check Active Alerts

```typescript
// Get system alerts
const { alerts, count } = await client.governance.getAlerts();

for (const alert of alerts) {
  console.log(`[${alert.severity}] ${alert.title}`);
}
```

## Memory Examples

```typescript
// Store a memory
const memory = await client.memory.record({
  content: 'User prefers TypeScript',
  importance: 0.8,
  tags: ['preference']
});

// Query memories
const results = await client.memory.query({
  query: 'programming preferences',
  limit: 5
});

for (const match of results.matches) {
  console.log(`[${match.relevance.toFixed(2)}] ${match.memory.content}`);
}
```

## VFS Examples

```typescript
// Access files via VFS
const files = await client.bridge.listFiles('/project/src');
const content = await client.bridge.readFile('/project/src/main.ts');
```

## Configuration

```typescript
const client = new BravoZeroClient({
  apiKey: process.env.BRAVOZERO_API_KEY,
  baseUrl: 'https://api.bravozero.ai',
  timeout: 30000
});
```

## Error Handling

```typescript
import {
  RateLimitError,
  ConstitutionDeniedError,
  NotFoundError,
  ServiceUnavailableError
} from '@bravozero/sdk';

try {
  await client.governance.evaluate({ 
    agentId: 'agent-123',
    action: 'dangerous_action' 
  });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter}s`);
  } else if (error instanceof ConstitutionDeniedError) {
    console.log(`Denied: ${error.reasoning}`);
  } else if (error instanceof ServiceUnavailableError) {
    // Fallback logic
    console.log('Governance unavailable');
  }
}
```

## Documentation

- [Quickstart Guide](https://docs.bravozero.ai/getting-started)
- [Governance Integration](https://docs.bravozero.ai/guides/governance-integration)
- [API Reference](https://docs.bravozero.ai/api/governance-api)

## License

MIT

