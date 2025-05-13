const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');

// Configuration (customize these values as needed)
const config = {
  url: process.env.RABBITMQ_URL || 'amqp://rmquser:rmqpassword@localhost:5672',
  queue: 'assessment_queue',
  replyQueue: `amq.rabbitmq.reply-to`,
  exchange: '',
  routingKey: 'process_assessment_response',
};

// Create sample data for testing
const createSampleData = () => ({
  userId: uuidv4(),
  assessmentSessionId: uuidv4(),
  questionId: uuidv4(),
  userResponse: ['A', 'B', 'C', 'true', 'false'][Math.floor(Math.random() * 5)],
});

/**
 * RPC Client for RabbitMQ
 * This demonstrates how to send a message to RabbitMQ and wait for a response
 */
async function sendRPCMessage() {
  console.log('Starting RabbitMQ RPC Client...');
  console.log(`Connecting to: ${config.url}`);
  
  let connection;
  
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(config.url);
    console.log('✅ Successfully connected to RabbitMQ');
    
    // Create a channel
    const channel = await connection.createChannel();
    console.log('✅ Successfully created a channel');
    
    // Create a random correlation ID for this request
    const correlationId = uuidv4();
    
    // Generate sample data for the message
    const messageData = createSampleData();
    console.log('📝 Generated message payload:', messageData);
    
    // Convert message to a buffer
    const message = Buffer.from(JSON.stringify(messageData));
    
    // Publish the message
    channel.publish(
      config.exchange,
      config.routingKey,
      message,
      {
        correlationId,
        replyTo: config.replyQueue,
        persistent: true,
      }
    );
    
    console.log(`✅ Message published with routing key "${config.routingKey}" and correlationId "${correlationId}"`);
    
    // Set up a consumer for the reply queue
    console.log(`⏳ Waiting for response on queue "${config.replyQueue}"...`);
    
    // Set up a promise that will resolve when we get a response
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for RPC response'));
      }, 30000); // 30 second timeout
      
      channel.consume(
        config.replyQueue,
        (msg) => {
          if (msg.properties.correlationId === correlationId) {
            clearTimeout(timeout);
            resolve(JSON.parse(msg.content.toString()));
          }
        },
        { noAck: true }
      );
    });
    
    // Wait for the response
    const response = await responsePromise;
    console.log('✅ Received response:', response);
    
    // Close the connection
    await channel.close();
    await connection.close();
    console.log('✅ Connection closed');
    
    return response;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.close();
    }
    process.exit(1);
  }
}

/**
 * Fire and forget message (no response expected)
 */
async function sendFireAndForgetMessage() {
  console.log('Starting RabbitMQ Fire-and-Forget Client...');
  console.log(`Connecting to: ${config.url}`);
  
  let connection;
  
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(config.url);
    console.log('✅ Successfully connected to RabbitMQ');
    
    // Create a channel
    const channel = await connection.createChannel();
    console.log('✅ Successfully created a channel');
    
    // Generate sample data for the message
    const messageData = createSampleData();
    console.log('📝 Generated message payload:', messageData);
    
    // Convert message to a buffer
    const message = Buffer.from(JSON.stringify(messageData));
    
    // Publish the message
    channel.publish(
      config.exchange,
      config.routingKey,
      message,
      { persistent: true }
    );
    
    console.log(`✅ Message published with routing key "${config.routingKey}"`);
    
    // Close the connection after a short delay
    setTimeout(async () => {
      await channel.close();
      await connection.close();
      console.log('✅ Connection closed');
    }, 1000);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.close();
    }
    process.exit(1);
  }
}

// Choose which example to run
const mode = process.argv[2] || 'rpc';

if (mode === 'rpc') {
  console.log('📤 Running RPC Client Example...');
  sendRPCMessage();
} else {
  console.log('📤 Running Fire-and-Forget Client Example...');
  sendFireAndForgetMessage();
} 