import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const viteArgs = process.argv.slice(2);
const children = [];

function start(label, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (code === 0 || signal) return;
    console.error(`[dev] ${label} exited with code ${code}`);
    shutdown(code ?? 1);
  });
  return child;
}

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 150);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start('PartyKit', npm, ['run', 'partykit:dev', '--', '--port', '1999']);
start('Vite', npm, ['run', 'dev:vite', '--', ...viteArgs], {
  env: {
    ...process.env,
    VITE_SHARED_VERSUS: process.env.VITE_SHARED_VERSUS ?? '1',
    VITE_SHARED_VERSUS_HOST: process.env.VITE_SHARED_VERSUS_HOST ?? 'localhost:1999',
  },
});
