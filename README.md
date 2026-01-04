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
  apiKey: 'your-api-key',
  agentId: 'your-agent-id'
});

// Evaluate an action
const result = await client.constitution.evaluate({
  action: 'read_file',
  context: { path: '/src/main.ts' }
});

if (result.decision === 'permit') {
  console.log('Action allowed!');
} else {
  console.log(`Denied: ${result.reasoning}`);
}

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

// Access VFS
const files = await client.bridge.listFiles('/project/src');
const content = await client.bridge.readFile('/project/src/main.ts');
```

## Configuration

```typescript
const client = new BravoZeroClient({
  apiKey: process.env.BRAVOZERO_API_KEY,
  agentId: process.env.BRAVOZERO_AGENT_ID,
  baseUrl: 'https://api.bravozero.ai',
  timeout: 30000
});
```

## Error Handling

```typescript
import {
  RateLimitError,
  ConstitutionDeniedError,
  NotFoundError
} from '@bravozero/sdk';

try {
  await client.constitution.evaluate({ action: 'dangerous_action' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter}s`);
  } else if (error instanceof ConstitutionDeniedError) {
    console.log(`Denied: ${error.reasoning}`);
  }
}
```

## Documentation

- [Quickstart Guide](https://docs.bravozero.ai/getting-started)
- [API Reference](https://docs.bravozero.ai/api)

## License

MIT

