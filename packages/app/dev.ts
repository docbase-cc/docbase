import { spawnSync } from "child_process";
import { join } from "path";
import { version } from "~/package.json";
import { _dirname } from "./src/utils";

spawnSync("bun", ["x", "prisma", "migrate", "dev", "-n", version], {
  stdio: "inherit",
  env: {
    DATABASE_URL: `file:${join(_dirname, ".docbase/data/db.sqlite")}`,
  },
});

spawnSync("bun", ["run", "./gen.ts"], {
  stdio: "inherit",
});

spawnSync("bun", ["run", "--hot", "src/main.ts"], {
  stdio: "inherit",
});
