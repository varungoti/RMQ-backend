# RabbitMQ Testing Guide

This guide provides step-by-step instructions for testing the RabbitMQ integration in the assessment platform.

## Step 1: Start RabbitMQ

Start the RabbitMQ server using Docker:

### Windows
```bash
start-rabbitmq.cmd
```

### Linux/macOS
```bash
docker run -d --name rmq_rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=rmquser \
  -e RABBITMQ_DEFAULT_PASS=rmqpassword \
  -e RABBITMQ_DEFAULT_VHOST=/ \
  rabbitmq:3-management-alpine
```

## Step 2: Verify RabbitMQ is Running

You can verify that RabbitMQ is running by:

1. Accessing the management interface at http://localhost:15672/
   - Username: `rmquser`
   - Password: `rmqpassword`

2. Running the basic connectivity test:
   ```bash
   node server/test/rabbit-mq-client.js
   ```

## Step 3: Start the Application

Start the NestJS application in development mode:

```bash
cd server
pnpm start:dev
```

## Step 4: Testing Asynchronous Endpoints

There are several ways to test the asynchronous endpoints:

### Using Swagger UI

1. Navigate to http://localhost:3001/api/docs (or your configured port)
2. Authenticate with a valid user
3. Use the `/assessment/submit-async` and `/assessment/finish-session-async` endpoints

### Using curl

```bash
# Submit an answer asynchronously
curl -X POST http://localhost:3001/assessment/submit-async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assessmentSessionId": "YOUR_SESSION_ID",
    "questionId": "YOUR_QUESTION_ID",
    "userResponse": "YOUR_ANSWER"
  }'

# Finish a session asynchronously
curl -X POST http://localhost:3001/assessment/finish-session-async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assessmentSessionId": "YOUR_SESSION_ID"
  }'
```

### Using the Client Example

The provided client example script can be used to test the RabbitMQ integration directly:

```bash
# Test with RPC (response expected)
node client-example.js rpc

# Test with fire-and-forget (no response expected)
node client-example.js fire
```

## Step 5: Monitoring

### Verify Messages in Management Interface

1. Log in to the RabbitMQ management interface
2. Navigate to the "Queues" tab
3. Click on the `assessment_queue` queue
4. Check the "Messages" section for incoming messages

### Monitor Server Logs

Watch the server logs for messages related to RabbitMQ processing:

```bash
# Look for these log entries
- "Connected to RabbitMQ"
- "Processing assessment response"
- "Finishing assessment session"
```

## Troubleshooting

### Connection Issues

If you experience connection issues with RabbitMQ:

1. Ensure RabbitMQ is running:
   ```bash
   docker ps | grep rabbitmq
   ```

2. Check RabbitMQ logs:
   ```bash
   docker logs rmq_rabbitmq
   ```

3. Verify the connection URL:
   When testing locally, use:
   ```
   amqp://rmquser:rmqpassword@localhost:5672
   ```

   Within Docker Compose:
   ```
   amqp://rmquser:rmqpassword@rabbitmq:5672
   ```

### Common Issues

1. **Error: ECONNREFUSED**
   - Make sure RabbitMQ is running
   - Check the hostname and port are correct

2. **Authentication Failed**
   - Verify username and password are correct
   - Check virtual host permissions

3. **Channel-level exceptions**
   - Check for queue existence 
   - Verify queue permissions

## Stopping RabbitMQ

When you're done testing, stop the RabbitMQ container:

### Windows
```bash
stop-rabbitmq.cmd
```

### Linux/macOS
```bash
docker stop rmq_rabbitmq
docker rm rmq_rabbitmq
```

## Next Steps

After basic testing is complete, consider:

1. Load testing with multiple messages
2. Testing failure scenarios (e.g., invalid message formats)
3. Testing reconnection behavior when RabbitMQ restarts 