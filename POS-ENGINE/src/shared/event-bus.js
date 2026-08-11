/**
 * Event Bus - Kafka-compatible pattern
 * 
 * In development: uses in-memory pub/sub
 * In production: swap to real KafkaJS by changing KAFKA_BROKER env
 * 
 * Topics:
 *   - store.updated     → khi cửa hàng cập nhật thông tin
 *   - user.loggedIn     → khi user đăng nhập
 *   - user.passwordChanged → khi user đổi mật khẩu
 */

const USE_REAL_KAFKA = !!process.env.KAFKA_BROKER;
const logger = require('./logger');

let kafka = null;
let producer = null;
let consumers = [];

// In-memory fallback
const inMemorySubscribers = new Map();

async function initEventBus(clientId = 'pos-engine') {
  if (USE_REAL_KAFKA) {
    const { Kafka } = require('kafkajs');
    kafka = new Kafka({
      clientId,
      brokers: [process.env.KAFKA_BROKER],
    });
    producer = kafka.producer();
    await producer.connect();
    logger.info('EventBus connected to Kafka', { broker: process.env.KAFKA_BROKER });
  } else {
    logger.info('EventBus running in-memory mode', { hint: 'Set KAFKA_BROKER env to use real Kafka' });
  }
}

async function publish(topic, message) {
  const payload = {
    ...message,
    timestamp: new Date().toISOString(),
    topic,
  };

  if (USE_REAL_KAFKA && producer) {
    await producer.send({
      topic,
      messages: [{ key: message.key || null, value: JSON.stringify(payload) }],
    });
  } else {
    // In-memory dispatch
    const handlers = inMemorySubscribers.get(topic) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        logger.error('EventBus handler error', { topic, error: err.message });
      }
    }
  }

  // Also broadcast via WebSocket (if initialized)
  try {
    const { broadcast } = require('./websocket');
    const wsEvent = topic.replace('.', ':'); // store.updated → store:updated
    broadcast(wsEvent, payload);
  } catch {
    // WebSocket not initialized yet, ignore
  }
}

async function subscribe(topic, groupId, handler) {
  if (USE_REAL_KAFKA && kafka) {
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        const payload = JSON.parse(message.value.toString());
        await handler(payload);
      },
    });
    consumers.push(consumer);
  } else {
    // In-memory subscribe
    if (!inMemorySubscribers.has(topic)) {
      inMemorySubscribers.set(topic, []);
    }
    inMemorySubscribers.get(topic).push(handler);
  }
}

async function disconnect() {
  if (USE_REAL_KAFKA) {
    if (producer) await producer.disconnect();
    for (const consumer of consumers) {
      await consumer.disconnect();
    }
  }
}

module.exports = { initEventBus, publish, subscribe, disconnect };
