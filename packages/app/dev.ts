// bun x prisma migrate dev && bun run --hot src/main.ts
import { spawnSync } from "child_process";
import { env } from "process";
import { version } from "~/package.json";

spawnSync("bun", ["x", "prisma", "migrate", "dev", "-n", version], {
  stdio: "inherit",
  env: {
    ...env,
    DATABASE_URL: "file:./dev.db",
  },
});

spawnSync("bun", ["run", "--hot", "src/main.ts"], { stdio: "inherit" });
