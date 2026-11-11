import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import directory from './directory.json' with { type: 'json' };

// Starts the whole platform as separate processes on this machine (no Docker needed):
// the broker, one regional API per country (plus Colombia's replica) and the three services.
// Type commands while it runs to break things on purpose and watch the system cope:
//   ps · stop <name> · start <name> · restart <name> · quit
// The region instances and their ports come from directory.json, the naming service.

const regions = Object.fromEntries(
  Object.entries(directory.regions).flatMap(([country, urls]) =>
    urls.map((url, index) => {
      const instance = `${country.toLowerCase()}-${index + 1}`;
      return [instance, { file: 'server/region.js', env: { REGION: country, PORT: new URL(url).port, INSTANCE: instance } }];
    })
  )
);
const SERVICES = {
  broker: { file: 'server/broker.js', env: { PORT: new URL(directory.broker).port } },
  ...regions,
  payments: { file: 'server/payments.js', env: {} },
  logistics: { file: 'server/logistics.js', env: {} },
  notifications: { file: 'server/notifications.js', env: {} }
};

const running = new Map();
const colors = [31, 32, 33, 34, 35, 36, 91, 92, 93, 94, 95, 96];
const paint = (name, text) => `\x1b[${colors[Object.keys(SERVICES).indexOf(name) % colors.length]}m${name.padEnd(13)}\x1b[0m ${text}`;

const start = (name) => {
  const service = SERVICES[name];
  if (!service) return console.log(`unknown service ${name}; try: ${Object.keys(SERVICES).join(', ')}`);
  if (running.has(name)) return console.log(`${name} is already running`);
  const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', service.file], { env: { ...process.env, ...service.env }, stdio: ['ignore', 'pipe', 'pipe'] });
  running.set(name, child);
  const print = (chunk) => chunk.toString().split('\n').filter(Boolean).forEach((line) => console.log(paint(name, line)));
  child.stdout.on('data', print);
  child.stderr.on('data', print);
  child.on('exit', (code, signal) => {
    if (running.get(name) === child) running.delete(name);
    console.log(paint(name, `exited (${signal ?? code})`));
  });
};

const stop = (name) => {
  const child = running.get(name);
  if (!child) return console.log(`${name} is not running`);
  running.delete(name);
  child.kill('SIGKILL'); // a crash, not a polite shutdown: the broker's Last Will reports it
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

start('broker');
await wait(700);
for (const name of Object.keys(SERVICES).filter((entry) => entry !== 'broker')) start(name);

const commands = {
  ps: () => Object.keys(SERVICES).forEach((name) => console.log(`${running.has(name) ? '●' : '○'} ${name}${running.has(name) ? ` (pid ${running.get(name).pid})` : ''}`)),
  stop,
  start,
  restart: async (name) => {
    stop(name);
    await wait(300);
    start(name);
  },
  quit: () => {
    for (const name of [...running.keys()]) stop(name);
    process.exit(0);
  }
};

createInterface({ input: process.stdin }).on('line', (line) => {
  const [word, name] = line.trim().split(/\s+/);
  if (!word) return;
  const run = commands[word];
  if (!run) return console.log('commands: ps · stop <name> · start <name> · restart <name> · quit');
  run(name);
});
process.on('SIGINT', commands.quit);
process.on('SIGTERM', commands.quit);
console.log('Type "ps" to list services, "stop payments" to bring one down, "start payments" to bring it back.');
