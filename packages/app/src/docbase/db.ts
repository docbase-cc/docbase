import { DBLayer, DocBaseConfig } from "core/src";
import { PackageManager } from "./pkgManager";
import path, { join } from "path";
import { exists, existsSync, readJSON, rm, writeJSON } from "fs-extra";
import { PrismaClient } from "@prisma/client";
import { mkdir } from "fs/promises";
import { env } from "process";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

/** docbase 本地数据持久层 */
export class DB implements DBLayer {
  #pkgManager: PackageManager;
  #configPath: string;
  #dbPath: string;
  #prisma: PrismaClient;
  #fileDir: string;

  constructor({
    dataDir,
    pkgManager,
    fileDir,
  }: {
    dataDir: string;
    fileDir: string;
    pkgManager: PackageManager;
  }) {
    this.#fileDir = fileDir;
    this.#configPath = join(dataDir, "config.json");
    this.#pkgManager = pkgManager;
    this.#dbPath = join(dataDir, "db.sqlite");
    const url = `file:${this.#dbPath}`;
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const prodPrismaPath = join(__dirname, "prisma");
    const prodPrismaExists = existsSync(prodPrismaPath);
    spawnSync("bun", ["x", "prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: {
        ...env,
        DATABASE_URL: url,
      },
      cwd: prodPrismaExists ? prodPrismaPath : undefined,
    });
    this.#prisma = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  plugins = () => {
    const self = this;
    return (async function* () {
      const plugins = await self.#prisma.plugin.findMany();
      for (const { name, config } of plugins) {
        const plugin = await self.#pkgManager.import(name);
        yield {
          plugin,
          config: config as object,
        };
      }
    })();
  };

  getConfig = async (): Promise<DocBaseConfig> => {
    const configExists = await exists(this.#configPath);
    if (!configExists) {
      return await this.#initConifgFromEnv();
    } else {
      const config = await readJSON(this.#configPath);
      return config as DocBaseConfig;
    }
  };

  #initConifgFromEnv = async () => {
    if (env.MEILI_URL && env.MEILI_MASTER_KEY) {
      const config = {
        meiliSearchConfig: {
          host: env.MEILI_URL,
          apiKey: env.MEILI_MASTER_KEY,
        },
      };
      await writeJSON(this.#configPath, config);
      return config;
    } else {
      throw new Error("MEILI_URL and MEILI_MASTER_KEY env must be set");
    }
  };

  knowledgeBase = {
    add: async (name: string) => {
      const res = await this.#prisma.knowledgeBase.create({
        data: {
          name,
        },
      });
      const path = join(this.#fileDir, res.id);
      await mkdir(path);
      return { path, ...res };
    },
    del: async (id: string) => {
      const res = await this.#prisma.knowledgeBase.delete({
        where: {
          id,
        },
      });
      const path = join(this.#fileDir, res.id);
      await rm(path, { force: true, recursive: true });
      return { path, ...res };
    },
    all: () => {
      const self = this;
      return (async function* () {
        const plugins = await self.#prisma.knowledgeBase.findMany();
        for (const { name, id } of plugins) {
          yield {
            name,
            id,
            path: join(self.#fileDir, id),
          };
        }
      })();
    },
  };
}
