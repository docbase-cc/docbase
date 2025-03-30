import { spawnSync } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { version } from "~/package.json";

spawnSync("bun", ["run", "./gen.ts"], {
  stdio: "inherit",
});

spawnSync(
  "bun",
  ["x", "prisma", "migrate", "dev", "--skip-generate", "-n", version],
  {
    stdio: "inherit",
    env: {
      DATABASE_URL: `file:${join(homedir(), ".docbase/data/db.sqlite")}`,
    },
  }
);

spawnSync("bun", ["run", "--hot", "src/main.ts"], {
  stdio: "inherit",
});
