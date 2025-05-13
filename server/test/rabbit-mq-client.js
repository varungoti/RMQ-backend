// Simple RabbitMQ test client to verify connectivity and send messages
const amqp = require('amqplib');

// Configuration (customize these values as needed)
const config = {
  url: process.env.RABBITMQ_URL || 'amqp://rmquser:rmqpassword@localhost:5672',
  queue: 'assessment_queue',
  exchange: '',
  routingKey: 'process_assessment_response',
};

// Sample message to publish
const sampleMessage = {
  userId: '12345678-1234-1234-1234-123456789abc',
  assessmentSessionId: '87654321-4321-4321-4321-cba987654321',
  questionId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  userResponse: 'A',
};

async function testRabbitMQConnection() {
  console.log('Testing RabbitMQ Connection...');
  console.log(`Connecting to: ${config.url}`);
  
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(config.url);
    console.log('✅ Successfully connected to RabbitMQ');
    
    // Create a channel
    const channel = await connection.createChannel();
    console.log('✅ Successfully created a channel');
    
    // Make sure the queue exists (create it if it doesn't)
    await channel.assertQueue(config.queue, { durable: true });
    console.log(`✅ Queue "${config.queue}" is ready`);
    
    // Publish a message
    const messageBuffer = Buffer.from(JSON.stringify(sampleMessage));
    const publishResult = channel.publish(
      config.exchange,
      config.routingKey,
      messageBuffer,
      { persistent: true }
    );
    
    console.log(`✅ Message published to queue "${config.queue}" with routing key "${config.routingKey}"`);
    console.log('Message content:', JSON.stringify(sampleMessage, null, 2));
    
    // Close the connection
    setTimeout(() => {
      connection.close();
      console.log('Connection closed');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error connecting to RabbitMQ:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure RabbitMQ server is running and accessible.');
    }
    process.exit(1);
  }
}

// Start the test
testRabbitMQConnection(); 