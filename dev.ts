import concurrently from "concurrently";

concurrently(
  [
    {
      command: "bun run --bun dev",
      prefixColor: "blue",
      name: "server",
      cwd: "packages/app",
    },
    {
      command: "bun run dev",
      name: "front",
      prefixColor: "green",
      cwd: "packages/ui",
    },
  ],
  {
    outputStream: process.stdout,
  }
);
