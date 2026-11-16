import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import directory from '../server/directory.json' with { type: 'json' };

// npm run demo: the whole platform on Docker, one container per process (docker-compose.yml).
// Builds and starts the containers, waits until every region and the web app answer, then takes
// commands to break things during the demo. Ctrl+C or "quit" takes the containers down (the
// volumes stay, so the orders survive to the next run).

const WEB = 'http://localhost:4173';
const compose = (...args) => spawnSync('docker', ['compose', ...args], { stdio: 'inherit' }).status === 0;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
  console.error([
    'Docker is not answering. Open Docker Desktop and wait until it says "Engine running".',
    'If it never gets there, turn on virtualization in the BIOS (AMD: SVM Mode, Intel: VT-x).',
    'Without Docker, "npm run demo:local" runs the same processes directly with Node.'
  ].join('\n'));
  process.exit(1);
}
if (!compose('up', '--build', '--detach')) process.exit(1);

const targets = [WEB, ...Object.values(directory.regions).flat().map((url) => `${url.replace('127.0.0.1', 'localhost')}/health`)];
const answers = async (url) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};
process.stdout.write('\nWaiting for the regions and the web app');
for (const deadline = Date.now() + 120000; ; ) {
  const up = await Promise.all(targets.map(answers));
  if (up.every(Boolean)) break;
  if (Date.now() > deadline) {
    console.log(`\nStill not answering: ${targets.filter((_, index) => !up[index]).join(', ')}. See "docker compose logs".`);
    break;
  }
  process.stdout.write('.');
  await wait(1500);
}

const down = () => {
  console.log('\nTaking the containers down...');
  compose('down');
  process.exit(0);
};

console.log(`

nutriFlow is running on Docker.
  Open ${WEB}/login in four tabs and sign in as customer, store, courier and admin.
  Each tab talks to its country's region (the badge in the header names the server);
  the admin console hears all five.

Commands:
  ps                  the containers and their state
  kill <name>         crash a container (payments, co-1, logistics, broker...)
  start <name>        bring it back
  logs <name>         its last lines
  quit                take everything down (or Ctrl+C)
`);

const commands = {
  ps: () => compose('ps', '--format', 'table {{.Service}}\t{{.State}}\t{{.Ports}}'),
  kill: (name) => compose('kill', name), // SIGKILL: a crash, so the broker's Last Will reports it
  stop: (name) => compose('kill', name),
  start: (name) => compose('start', name),
  logs: (name) => compose('logs', '--tail', '20', name),
  quit: down
};
createInterface({ input: process.stdin }).on('line', (line) => {
  const [word, name] = line.trim().split(/\s+/);
  if (!word) return;
  const run = commands[word];
  if (!run || (word !== 'ps' && word !== 'quit' && !name)) return console.log('commands: ps · kill <name> · start <name> · logs <name> · quit');
  run(name);
});
process.on('SIGINT', down);
process.on('SIGTERM', down);
