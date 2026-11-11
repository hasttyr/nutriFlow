import mqtt from 'mqtt';
import directory from '../directory.json' with { type: 'json' };

// Message bus over MQTT (open standard, OASIS). Every service is a client of the broker:
// - QoS 1 + persistent session (clean: false): at-least-once delivery; messages for a service that
//   is down wait in the broker and arrive when it reconnects (retransmission).
// - Retained messages carry the latest state of each region, so a new subscriber starts complete.
// - Last Will: if a service dies, the broker itself announces it as offline (failure detection).

// MQTT topic filter matching (+ is one level, # the rest).
export const matches = (filter, topic) => {
  const want = filter.split('/');
  const have = topic.split('/');
  for (let index = 0; index < want.length; index += 1) {
    if (want[index] === '#') return true;
    if (want[index] !== '+' && want[index] !== have[index]) return false;
  }
  return want.length === have.length;
};

// Handlers are registered before connecting: queued messages arrive right after the handshake.
export const createBus = (name, { clean = false } = {}) => {
  const handlers = [];
  const health = `nf/system/health/${name}`;
  const client = mqtt.connect(process.env.BROKER_URL ?? directory.broker, {
    clientId: name,
    clean,
    manualConnect: true,
    reconnectPeriod: 1000,
    will: { topic: health, payload: JSON.stringify({ status: 'offline' }), retain: true, qos: 1 }
  });
  client.on('message', (topic, payload) => {
    let data;
    try {
      data = JSON.parse(payload.toString() || 'null');
    } catch {
      return; // not ours
    }
    for (const handler of handlers) {
      if (!matches(handler.filter, topic)) continue;
      Promise.resolve(handler.run(data, topic)).catch((error) => console.error(`[${name}] ${topic}:`, error.message));
    }
  });
  client.on('connect', () => {
    client.publish(health, JSON.stringify({ status: 'online', pid: process.pid, at: new Date().toISOString() }), { retain: true, qos: 1 });
    for (const handler of handlers) client.subscribe(handler.filter, { qos: handler.qos });
  });
  client.on('error', (error) => console.error(`[${name}] bus:`, error.message));

  return {
    on: (filter, run, qos = 1) => handlers.push({ filter, run, qos }),
    start: () =>
      new Promise((resolve) => {
        client.once('connect', resolve);
        client.connect();
      }),
    publish: (topic, data, { retain = false, qos = 1 } = {}) => client.publishAsync(topic, JSON.stringify(data), { retain, qos }),
    stop: () => client.endAsync()
  };
};
