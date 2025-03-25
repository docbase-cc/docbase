import { Base, DBLayer, DocBaseConfig, PluginWithConfig } from "core/src";
import { PackageManager } from "./pkgManager";

class DB implements DBLayer {
  #dataPath: string;
  #pkgManager: PackageManager;
  constructor({
    dataPath,
    pkgManager,
  }: {
    dataPath: string;
    pkgManager: PackageManager;
  }) {
    this.#dataPath = dataPath;
    this.#pkgManager = pkgManager;
  }

  plugins = () => {
    return (async function* () {
      for (const name of Object.keys(await this.#pkgManager.list())) {
        const plugin = await this.#pkgManager.import(name);
        // TODO: 从配置文件中读取配置
        yield {
          plugin,
          config: {},
        };
      }
    })();
  };
  getConfig = async () => {
    // TODO: 从配置文件中读取配置
    return { meiliSearchConfig: { host: "" } };
  };
  knowledgeBase: {
    add: (name: string) => Promise<Base>;
    del: (id: string) => Promise<Base>;
    all: () => AsyncIterable<Base>;
  };
}
