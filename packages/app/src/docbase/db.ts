import { DBLayer, DocBaseConfig, Plugin } from "core";
import { PackageManager } from "./pkgManager";
import { join } from "path";
import {
  exists,
  existsSync,
  readJSON,
  rm,
  writeJSON,
  writeJsonSync,
} from "fs-extra";
import type { PrismaClient } from "@prisma/client";
import { mkdir } from "fs/promises";
import { env } from "process";
import { spawnSync } from "child_process";
import { dirname } from "../utils";

/** docbase 本地数据持久层 */
export class DB implements DBLayer {
  #pkgManager: PackageManager;
  #configPath: string;
  #dbPath: string;
  #prisma!: PrismaClient;
  #fileDir: string;
  #dbURL: string;

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

    // 如果有环境变量，则按环境变量初始化
    if (env.MEILI_URL && env.MEILI_MASTER_KEY) {
      const config = {
        meiliSearchConfig: {
          host: env.MEILI_URL,
          apiKey: env.MEILI_MASTER_KEY,
        },
      };
      writeJsonSync(this.#configPath, config);
    }

    // 初始化数据库
    const url = `file:${this.#dbPath}`;
    const __dirname = dirname();
    const prodPrismaPath = join(__dirname, "prisma");
    const prodPrismaExists = existsSync(prodPrismaPath);

    spawnSync("bun", ["x", "prisma", "generate"], {
      stdio: "inherit",
      env: {
        DATABASE_URL: url,
      },
      cwd: prodPrismaExists ? __dirname : undefined,
    });

    spawnSync("bun", ["x", "prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: {
        DATABASE_URL: url,
      },
      cwd: prodPrismaExists ? __dirname : undefined,
    });

    this.#dbURL = url;
  }

  init = async () => {
    const pc = await import("@prisma/client");
    this.#prisma = new pc.default.PrismaClient({
      datasources: {
        db: {
          url: this.#dbURL,
        },
      },
    });
  };

  plugin = {
    exists: async (name: string) => {
      const res = await this.#prisma.plugin.findUnique({
        where: {
          name,
        },
      });
      return !!res;
    },
    all: () => {
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
    },
    del: async (name: string) => {
      await this.#prisma.plugin.delete({
        where: {
          name,
        },
      });
    },
    add: async (plugin: Plugin) => {
      await this.#prisma.plugin.upsert({
        where: {
          name: plugin.name,
        },
        create: {
          name: plugin.name,
          config: plugin.config,
        },
        update: {
          config: plugin.config,
        },
      });
    },
  };

  config = {
    get: async (): Promise<DocBaseConfig> => {
      const configExists = await exists(this.#configPath);
      if (!configExists) {
        throw new Error("config not found, you should init system first");
      } else {
        const config = await readJSON(this.#configPath);
        return config as DocBaseConfig;
      }
    },
    exists: () => {
      return exists(this.#configPath);
    },
    set: async (config: DocBaseConfig) => {
      await writeJSON(this.#configPath, config);
    },
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
