import { DBLayer } from "core/src";
import { PackageManager } from "./pkgManager";
import { join } from "path";
import { readJSON, rm } from "fs-extra";
import { PrismaClient } from "@prisma/client";
import { mkdir } from "fs/promises";

export class DB implements DBLayer {
  #dataDir: string;
  #pkgManager: PackageManager;
  #configPath: string;
  #prisma: PrismaClient;

  constructor({
    dataDir,
    pkgManager,
  }: {
    dataDir: string;
    pkgManager: PackageManager;
  }) {
    this.#dataDir = dataDir;
    this.#configPath = join(dataDir, "config.json");
    this.#pkgManager = pkgManager;
    const dbFile = join(dataDir, "db.sqlite");
    this.#prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbFile}`,
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

  getConfig = async () => await readJSON(this.#configPath);

  knowledgeBase = {
    add: async (name: string) => {
      const res = await this.#prisma.knowledgeBase.create({
        data: {
          name,
        },
      });
      const path = join(this.#dataDir, res.id);
      await mkdir(path);
      return { path, ...res };
    },
    del: async (id: string) => {
      const res = await this.#prisma.knowledgeBase.delete({
        where: {
          id,
        },
      });
      const path = join(this.#dataDir, res.id);
      await rm(path, { force: true });
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
            path: join(self.#dataDir, id),
          };
        }
      })();
    },
  };
}
