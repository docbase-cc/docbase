import {
  defaultDocLoaderPlugin,
  type DocLoader,
  type DocLoaderPlugin,
} from "./DocLoader";
import { DocManager } from "./DocManager";
import {
  defaultDocScannerPlugin,
  type DocScanner,
  type DocScannerPlugin,
} from "./DocScanner";
import {
  defaultDocSplitterPlugin,
  type DocSplitter,
  type DocSplitterPlugin,
} from "./DocSplitter";
import {
  defaultDocWatcherPlugin,
  type DocWatcher,
  type DocWatcherPlugin,
  type UnWatch,
} from "./DocWatcher";
import type { BasePlugin } from "./Plugin";
import { getExtFromPath } from "./Utils";
import type { Config as MeiliSearchConfig } from "meilisearch";

export class DocBase {
  // 文档管理器
  #docManager!: DocManager;

  // 插件
  // 文档加载指向器
  // ext => DocLoader
  #docLoaders: Map<string, DocLoader> = new Map();
  // 文档分割器
  #docSplitter!: DocSplitter;

  // 文档监视器
  #docWatcher!: DocWatcher;

  // 挂载的知识识库目录
  #baseDirs = new Map<
    string,
    {
      unwatch: UnWatch;
    }
  >();

  // 获取挂载的知识库目录
  get dirs() {
    return Array.from(this.#baseDirs.keys());
  }

  // 文档扫描器
  #docScanner!: DocScanner;

  // 根据 ext 分流的 docLoader
  #hyperDocLoader: DocLoader = async (path) => {
    const ext = getExtFromPath(path);

    const docLoader = this.#docLoaders.get(ext);

    if (!docLoader) {
      throw new Error(`No such docLoader can solve ext ${ext}`);
    }

    return await docLoader(path);
  };

  // 扫描指定目录文档
  #scan = async (dirs: string[]) => {
    await this.#docScanner({
      dirs,
      exts: Array.from(this.#docLoaders.keys()),
      load: async (paths) => {
        for (const path of paths) {
          await this.#docManager.upsertDoc(path);
        }
      },
    });
  };

  #watch = async (dir: string) => {
    const unwatch = await this.#docWatcher({
      path: dir,
      filter: (path: string) => {
        const ext = getExtFromPath(path);
        return this.#docLoaders.has(ext);
      },
      upsert: async (path: string) => await this.#docManager.upsertDoc(path),
      remove: async (path: string) =>
        await this.#docManager.deleteDocByPath(path),
    });

    this.#baseDirs.set(dir, {
      unwatch,
    });
  };

  start = async ({
    meiliSearchConfig,
    indexPrefix,
    initPaths = [],
    initPlugins = [
      {
        plugin: defaultDocLoaderPlugin,
        params: {},
      },
      {
        plugin: defaultDocScannerPlugin,
        params: {},
      },
      {
        plugin: defaultDocSplitterPlugin,
        params: {
          len: 1000,
        },
      },
      {
        plugin: defaultDocWatcherPlugin,
        params: {},
      },
    ],
    initscan = true,
  }: {
    // MeiliSearch 配置
    meiliSearchConfig: MeiliSearchConfig;
    // 初始化知识库目录
    initPaths?: string[];
    // 初始化插件
    initPlugins?: { plugin: BasePlugin; params: object }[];
    // 是否在初始化时扫描初始化知识库目录
    initscan?: boolean;
    indexPrefix?: string;
  }) => {
    // 加载所有插件
    for (const initPlugin of initPlugins) {
      // 插件构造体和插件初始化参数
      const { plugin, params } = initPlugin;

      switch (plugin.type) {
        case "DocScanner":
          const docScannerPlugin = plugin as unknown as DocScannerPlugin;
          this.#docScanner = await docScannerPlugin.init(params);
          break;

        case "DocSplitter":
          const docSplitterPlugin = plugin as unknown as DocSplitterPlugin;
          this.#docSplitter = await docSplitterPlugin.init(params);
          break;

        case "DocWatcher":
          const docWatcherPlugin = plugin as unknown as DocWatcherPlugin;
          this.#docWatcher = await docWatcherPlugin.init(params);
          break;

        case "DocLoader":
          const docLoaderPlugin = plugin as unknown as DocLoaderPlugin;
          const docLoader = await docLoaderPlugin.init(params);
          // 将文档加载器注册到文档加载指向器
          for (const ext of docLoaderPlugin.exts) {
            this.#docLoaders.set(ext, docLoader);
          }
          break;

        default:
          throw new Error("Plugin type not implemented.");
      }
    }

    const docWatcherExist = typeof this.#docWatcher === "function";
    const docScannerExist = typeof this.#docScanner === "function";
    const docSplitterExist = typeof this.#docSplitter === "function";
    const docLoadersExist = this.#docLoaders.size > 0;

    // 校验文档监视器、文档扫描器、文档分割器是否存在
    if (
      !docWatcherExist ||
      !docScannerExist ||
      !docSplitterExist ||
      !docLoadersExist
    ) {
      const msg = `DocWatcher: ${docWatcherExist} | DocScanner: ${docScannerExist}\nDocLoaders: ${docLoadersExist} | DocSplitter: ${docSplitterExist}`;
      throw new Error("Loaded components: \n" + msg);
    }

    // 初始化文档管理器
    this.#docManager = new DocManager({
      indexPrefix,
      meiliSearchConfig,
      docLoader: (path) => this.#hyperDocLoader(path),
      docSplitter: (text) => this.#docSplitter(text),
    });
    await this.#docManager.init();

    // 扫描加载默认目录下文档
    if (initscan) {
      await this.#scan(initPaths);
    }

    // 开启监视，同步变动文档
    for (const initPath of initPaths) {
      await this.#watch(initPath);
    }
  };

  // 动态添加知识库路径
  addDir = async (dir: string) => {
    // 扫描并监视
    await this.#scan([dir]);
    await this.#watch(dir);
  };

  // 动态删除知识库路径
  delDir = async (dir: string) => {
    const baseDir = this.#baseDirs.get(dir);

    if (baseDir) {
      // 取消监视
      await baseDir.unwatch();
      // 删除知识库中目录下所有文档
      await this.#docManager.deleteDocByPathPrefix(dir);
      // 删除知识库
      this.#baseDirs.delete(dir);
    }
  };

  // TODO 动态管理插件

  // 搜索文档
  search = async (query: string) => {
    return await this.#docManager.search(query);
  };
}
