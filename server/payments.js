import { createBus } from './lib/bus.js';
import { openDb } from './lib/db.js';

// Payment gateway (mock). Listens for charge and refund requests of every region and answers each
// one once: the order id is the idempotency key, so a request delivered twice (at-least-once)
// gets the same answer and never charges twice. A real gateway (Wompi, Mercado Pago, Stripe,
// Adyen, PayPay…) would sit behind this same message contract.
// Test cards follow the processors' convention: a token ending in 0002 is declined.

const db = openDb('payments', `
  CREATE TABLE IF NOT EXISTS payments (
    order_id TEXT PRIMARY KEY, region TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL,
    status TEXT NOT NULL, reference TEXT NOT NULL, at TEXT NOT NULL
  );
`);
const bus = createBus('payments');
const LATENCY_MS = Number(process.env.LATENCY_MS ?? 400);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

bus.on('nf/+/payments/request', async ({ orderId, amount, currency, token }, topic) => {
  const region = topic.split('/')[1];
  let payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
  if (!payment) {
    await wait(LATENCY_MS); // the processor thinking
    const approved = !String(token ?? '').endsWith('0002');
    const reference = `PAY-${region.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    db.prepare('INSERT OR IGNORE INTO payments VALUES (?, ?, ?, ?, ?, ?, ?)').run(orderId, region, amount, currency, approved ? 'captured' : 'declined', reference, new Date().toISOString());
    payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId);
    console.log(`[payments] ${orderId} ${payment.status} ${amount} ${currency}`);
  }
  await bus.publish(`nf/${region}/payments/result`, { orderId, approved: payment.status !== 'declined', reference: payment.reference });
});

bus.on('nf/+/payments/refund', ({ orderId }) => {
  const result = db.prepare("UPDATE payments SET status = 'refunded' WHERE order_id = ? AND status = 'captured'").run(orderId);
  if (result.changes) console.log(`[payments] ${orderId} refunded`);
});

await bus.start();
console.log('[payments] ready');
