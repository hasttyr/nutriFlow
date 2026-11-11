import net from 'node:net';
import { Aedes } from 'aedes';

// Message broker (middleware): MQTT 3.1.1 over TCP on port 1883.
// shortcut: in-memory persistence, so queued messages survive a service restart but not a broker
// restart; aedes-persistence-sqlite or -redis makes them durable without code changes elsewhere.
const PORT = Number(process.env.PORT ?? 1883);

const aedes = await Aedes.createBroker();
aedes.on('client', (client) => console.log(`[broker] + ${client.id}`));
aedes.on('clientDisconnect', (client) => console.log(`[broker] - ${client.id}`));

net.createServer(aedes.handle).listen(PORT, '0.0.0.0', () => console.log(`[broker] MQTT on tcp/${PORT}`));
