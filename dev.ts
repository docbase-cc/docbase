import concurrently from 'concurrently';

concurrently(
  [
    { command: 'bun run --bun dev', name: 'server', cwd: "packages/app" },
    {
      command: 'bun run dev',
      name: 'front',
      cwd: "packages/ui",
    },
  ],
  {
    outputStream: process.stdout,
  }
);