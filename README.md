# RMQ Assessment Platform

A comprehensive assessment platform with RabbitMQ integration for asynchronous processing.

## Features

- User authentication and authorization
- Assessment session management
- Question management
- Skills tracking
- Asynchronous processing with RabbitMQ
- Real-time results and feedback

## Technology Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL
- **Caching**: Redis
- **Message Broker**: RabbitMQ
- **Authentication**: JWT

## Quick Start

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Start the services with Docker Compose:

```bash
docker-compose up -d
```

4. Start the development server:

```bash
pnpm dev:server
```

### RabbitMQ Integration

The application uses RabbitMQ for asynchronous processing of assessment responses and session operations. The integration enables:

- Offloading heavy processing tasks to background workers
- Improving response times for users
- Ensuring reliable message delivery with retry mechanisms

For detailed information about the RabbitMQ integration, see [RABBITMQ.md](RABBITMQ.md).

### RabbitMQ Management Interface

When running with Docker Compose, you can access the RabbitMQ management interface at:

http://localhost:15672

Default credentials:
- Username: `rmquser`
- Password: `rmqpassword`

## API Response Helpers

The application uses a hybrid response format to support both legacy clients and newer API formats. When using the `createHybridResponse` function, follow these guidelines:

```typescript
// CORRECT usage - pass boolean directly
createHybridResponse(result, "Success message", result.isCorrect);

// INCORRECT usage - don't pass object with 'correct' property
createHybridResponse(result, "Success message", { correct: result.isCorrect });
```

For more details, see [Hybrid Response Fix](docs/hybrid-response-fix.md).

## Testing

To run the tests:

```bash
pnpm test
```

## RabbitMQ Testing

Several test clients are provided for testing the RabbitMQ integration:

```bash
# Basic connectivity test
node server/test/rabbit-mq-client.js

# RPC client test (response expected)
node client-example.js rpc

# Fire-and-forget test (no response expected)
node client-example.js fire
```

## License

MIT 