import { omit } from "es-toolkit";
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
import type { PluginWithParams } from "./Plugin";
import { getExtFromPath } from "./Utils";
import type { Config as MeiliSearchConfig } from "meilisearch";

export class DocBase {
  /** 文档管理器 */
  #docManager!: DocManager;

  /** 文档加载指向器，映射文件扩展名到文档加载器名称 */
  #docExtToLoaderName: Map<string, string> = new Map();

  /** 文档加载器，映射文档加载器名称到加载器实例 */
  #docLoaders: Map<string, DocLoaderPlugin & { func: DocLoader }> = new Map();

  /** 文档分割器 */
  #docSplitter!: DocSplitterPlugin & { func: DocSplitter };

  /** 文档监视器 */
  #docWatcher!: DocWatcherPlugin & { func: DocWatcher };

  /** 文档扫描器 */
  #docScanner!: DocScannerPlugin & { func: DocScanner };

  /** 挂载的知识库目录，存储目录路径和对应的取消监视函数 */
  #baseDirs = new Map<
    string,
    {
      unwatch: UnWatch;
    }
  >();

  /**  获取挂载的知识库目录 */
  get dirs() {
    return Array.from(this.#baseDirs.keys());
  }

  /** 获取支持的文档类型 */
  get exts() {
    return Array.from(this.#docExtToLoaderName.keys());
  }

  /** 获取所有可用文档加载器 */
  get docLoaders() {
    // 去掉 func init
    return Array.from(
      this.#docLoaders.values().map((v) => omit(v, ["func", "init"]))
    );
  }

  /**
   * 根据文件扩展名分流的文档加载器
   * @param path - 文件路径
   * @throws 如果没有找到对应的文档加载器会抛出错误
   */
  #hyperDocLoader: DocLoader = async (path) => {
    const ext = getExtFromPath(path);

    const docLoaderName = this.#docExtToLoaderName.get(ext);

    if (!docLoaderName) {
      throw new Error(`No such docLoaderName can solve ext ${ext}`);
    }

    const dockLoader = this.#docLoaders.get(docLoaderName);

    if (!dockLoader) {
      throw new Error(`No such docLoaderName ${docLoaderName}`);
    }

    return await dockLoader.func(path);
  };

  /**
   * 扫描指定目录中的文档
   * @param dirs - 要扫描的目录数组
   */
  #scan = async (dirs: string[]) => {
    await this.#docScanner.func({
      dirs,
      exts: Array.from(this.#docExtToLoaderName.keys()),
      load: async (paths) => {
        for (const path of paths) {
          await this.#docManager.upsertDoc(path);
        }
      },
    });
  };

  /**
   * 监视指定目录的文档变化
   * @param dir - 要监视的目录路径
   */
  #watch = async (dir: string) => {
    const unwatch = await this.#docWatcher.func({
      path: dir,
      filter: (path: string) => {
        const ext = getExtFromPath(path);
        return this.#docExtToLoaderName.has(ext);
      },
      upsert: async (path: string) => await this.#docManager.upsertDoc(path),
      remove: async (path: string) =>
        await this.#docManager.deleteDocByPath(path),
    });

    this.#baseDirs.set(dir, {
      unwatch,
    });
  };

  /** 启动 docbase */
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
    /**
     * MeiliSearch 配置
     */
    meiliSearchConfig: MeiliSearchConfig;
    /**
     * 初始化知识库目录
     * @default []
     */
    initPaths?: string[];
    /**
     * 初始化插件列表
     * @default 
     * [
     *   { plugin: defaultDocLoaderPlugin, params: {} },
     *   { plugin: defaultDocScannerPlugin, params: {} },
     *   { plugin: defaultDocSplitterPlugin, params: { len: 1000 } },
     *   { plugin: defaultDocWatcherPlugin, params: {} }
     * ]
     */
    initPlugins?: PluginWithParams<any>[];
    /**
     * 是否在初始化时扫描初始化知识库目录
     * @default true
     */
    initscan?: boolean;
    /**
     * 索引前缀
     */
    indexPrefix?: string;
  }) => {
    // 加载所有插件
    for (const initPlugin of initPlugins) {
      // 插件构造体和插件初始化参数
      await this.loadPlugin(initPlugin);
    }

    const docWatcherExist = typeof this.#docWatcher === "function";
    const docScannerExist = typeof this.#docScanner === "function";
    const docSplitterExist = typeof this.#docSplitter === "function";
    const docLoadersExist = this.#docExtToLoaderName.size > 0;

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
      docSplitter: (text) => this.#docSplitter.func(text),
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

  /**
   * 卸载文档加载器插件
   * @param docLoaderName - 要卸载的文档加载器名称
   * @throws 如果文档加载器正在使用中会抛出错误
   */
  delDocLoader = async (docLoaderName: string) => {
    const using = this.#docExtToLoaderName
      .values()
      .some((v) => v === docLoaderName);

    if (using) {
      throw new Error(`DocLoader ${docLoaderName} is using.`);
    }

    return this.#docLoaders.delete(docLoaderName);
  };

  /**
   * 为指定扩展名设置文档加载器
   * @param ext - 文档扩展名
   * @param docLoaderName - 文档加载器名称
   * @throws 如果文档加载器不存在或不支持该扩展名会抛出错误
   */
  setDocLoader = async (ext: string, docLoaderName: string) => {
    const docLoader = this.#docLoaders.get(docLoaderName);

    if (!docLoader) {
      throw new Error(`No such docLoaderName ${docLoaderName}`);
    }

    if (!docLoader.exts.includes(ext)) {
      throw new Error(`${docLoaderName} not support ${ext}`);
    }

    this.#docExtToLoaderName.set(ext, docLoaderName);
  };

  /**
   * 加载或更新插件
   * @template T - 插件参数类型
   * @param pluginWithParams - 包含插件和参数的配置对象
   * @throws 如果插件类型错误会抛出错误
   */
  loadPlugin = async <T extends object>(
    pluginWithParams: PluginWithParams<T>
  ) => {
    const { plugin, params } = pluginWithParams;

    const pluginToLoad = {
      ...plugin,
      func: await plugin.init(params),
    };

    switch (pluginToLoad.type) {
      case "DocLoader":
        this.#docLoaders.set(pluginToLoad.name, pluginToLoad as any);

        // 将文档加载器注册到文档加载指向器
        for (const ext of pluginToLoad.exts) {
          // 该拓展已经存在文档加载器，不覆盖
          if (!this.#docExtToLoaderName.has(ext)) {
            this.#docExtToLoaderName.set(ext, pluginToLoad.name);
          }
        }

        break;

      case "DocScanner":
        this.#docScanner = pluginToLoad as any;
        break;

      case "DocSplitter":
        this.#docSplitter = pluginToLoad as any;
        break;

      case "DocWatcher":
        this.#docWatcher = pluginToLoad as any;

        // 需要重新监视所有目录
        this.#baseDirs.entries().forEach(async ([dir, { unwatch }]) => {
          await unwatch();
          await this.#watch(dir);
        });
        break;

      default:
        throw new Error("Plugin type not implemented.");
    }
  };

  /**
   * 动态添加知识库目录
   * @param dir - 要添加的目录路径
   */
  addDir = async (dir: string) => {
    // 扫描并监视
    await this.#scan([dir]);
    await this.#watch(dir);
  };

  /**
   * 动态删除知识库目录
   * @param dir - 要删除的目录路径
   */
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

  /**
   * 搜索文档
   * @param query - 搜索查询字符串
   * @returns 返回搜索结果
   */
  search = async (query: string) => {
    return await this.#docManager.search(query);
  };
}
