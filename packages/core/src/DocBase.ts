import { omit, throttle } from "es-toolkit";
import defaultDocLoaderPlugin, {
  type DocLoader,
  type DocLoaderPlugin,
} from "./DocLoader";
import { DocManager } from "./DocManager";
import defaultDocSplitterPlugin, {
  type DocSplitterPlugin,
} from "./DocSplitter";
import type { PluginWithConfig } from "./Plugin";
import { createMeilisearchClient, getExtFromPath, printAllSettedResult } from "./Utils";
import { type SearchParams } from "meilisearch";
import { basename } from "path";
import { FSLayer, Scanner, Watcher } from "./FSLayer";
import { Base, DBLayer } from "./DBLayer";

/** 任务执行节流时间 */
const throttleMs = 500;

export interface DifyKnowledgeRequest {
  knowledge_id: string;
  query: string;
  retrieval_setting: {
    top_k: number;
    score_threshold: number;
  };
}

export interface DifyKnowledgeResponseRecord {
  text: string;
  score: number;
  title: string;
  metadata?: object;
}

/**
 * DocBase 初始化配置
 */
export interface DocBaseOptions {
  db: DBLayer
}

export class DocBase {
  /** 文档管理器 */
  #docManagers: Map<string, DocManager> = new Map();

  /** 文档加载指向器，映射文件扩展名到文档加载器名称 */
  #docExtToLoaderName: Map<string, string> = new Map();

  /** 文档加载器，映射文档加载器名称到加载器实例 */
  #docLoaders: Map<string, DocLoaderPlugin> = new Map();

  /** 文档分割器 */
  #docSplitter!: DocSplitterPlugin;

  /** 文档扫描器 */
  #docScanner!: Scanner;

  /** 文档监视器 */
  #docWatcher!: Watcher;

  /** 任务缓存器 */
  #watcherTaskCache = new Map<string, {
    docManagerId: string
    type: "remove" | "upsert"
  }>();

  /** 数据持久层 */
  #db: DBLayer;

  // 执行任务缓存器中的任务, 每 watcherTaskThrottleMs 毫秒最多执行一次
  #doWatcherTask = throttle(
    async () => {
      console.debug("Starting to execute watcher tasks...");
      const results = await Promise.allSettled(
        this.#watcherTaskCache.entries().map(async ([path, { docManagerId, type }]) => {
          const docManager = this.#docManagers.get(docManagerId);
          if (type === "upsert") {
            console.debug(`Upserting document: ${path}`);
            await docManager.upsertDoc(path);
            console.debug(`Document upserted: ${path}`);
          } else if (type === "remove") {
            console.debug(`Deleting document: ${path}`);
            await docManager.deleteDocByPath(path);
            console.debug(`Document deleted: ${path}`);
          }
        })
      );
      console.debug("Watcher tasks execution completed.");
      return results;
    },
    // 最小执行间隔
    throttleMs,
    { edges: ["trailing"] }
  );

  /** 获取支持的文档类型 */
  get exts() {
    console.info("Fetching supported document extensions...");
    const extensions = this.#docExtToLoaderName.entries();
    console.info("Supported document extensions fetched successfully.");
    return extensions;
  }

  /** 获取所有可用文档加载器 */
  get docLoaders() {
    console.info("Fetching all available document loaders...");
    const loaders = this.#docLoaders.values().map((v) => omit(v, ["func", "init"]));
    console.info("All available document loaders fetched successfully.");
    return loaders;
  }

  get docSplitter() {
    console.info("Fetching document splitter...");
    const splitter = omit(this.#docSplitter, ["func", "init"]);
    console.info("Document splitter fetched successfully.");
    return splitter;
  }

  /**
   * 根据文件扩展名分流的文档加载器
   * @param path - 文件路径
   * @throws 如果没有找到对应的文档加载器会抛出错误
   */
  #hyperDocLoader: DocLoader = async (input) => {
    const ext = getExtFromPath(input.path);
    const docLoaderName = this.#docExtToLoaderName.get(ext);

    if (!docLoaderName) {
      const errorMsg = `No such docLoaderName can solve ext ${ext}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const dockLoader = this.#docLoaders.get(docLoaderName);

    if (!dockLoader) {
      const errorMsg = `No such docLoaderName ${docLoaderName}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    return await dockLoader.func(input);
  };

  /** 该路径文件是否需要被 docbase 处理 */
  #pathFilterToLoader = (path: string) => {
    const ext = getExtFromPath(path);
    return this.#docExtToLoaderName.has(ext);
  }

  /**
   * 扫描指定目录中的文档
   * @param dirs - 要扫描的目录数组
   */
  #scan = async (id: string, dirs: string[]) => {
    const docManager = this.#docManagers.get(id)
    await this.#docScanner({
      dirs,
      exts: Array.from(this.#docExtToLoaderName.keys()),
      load: async (paths) => {
        // 使用 Promise.all 并行处理多个文档插入
        await Promise.all(
          paths.map(async (path) => {
            console.info(`Upserting document during scan: ${path}`);
            await docManager.upsertDoc(path);
            console.info(`Document upserted during scan: ${path}`);
          })
        );
        console.info(`Documents loaded from paths: ${paths.join(', ')}`);
      },
    });
    console.info(`Directories scanned successfully: ${dirs.join(', ')}`);
  };

  constructor(options: DocBaseOptions) {
    this.#db = options.db
  }

  /** 启动 docbase */
  start = async () => {
    console.info("Starting DocBase...");
    // 初始化插件
    console.info("Loading all plugins...");
    const plugins = await this.#db.plugin.get()
    const initPlugins: PluginWithConfig[] = [
      {
        plugin: defaultDocLoaderPlugin,
        config: {},
      },
      {
        plugin: defaultDocSplitterPlugin,
        config: {
          len: 1000,
        },
      },
      ...plugins
    ]
    // 加载所有插件
    await Promise.all(
      initPlugins.map((initPlugin) => this.loadPlugin(initPlugin, false))
    );

    const docSplitterExist = typeof this.#docSplitter.func === "function";
    const docLoadersExist = this.#docLoaders.size > 0;

    // 校验文档监视器、文档扫描器、文档分割器是否存在
    if (!docSplitterExist || !docLoadersExist) {
      const msg = `DocLoaders: ${docLoadersExist} | DocSplitter: ${docSplitterExist}`;
      console.error("Loaded components: \n" + msg);
      throw new Error("Loaded components: \n" + msg);
    }
    console.info("All plugins loaded successfully.");

    // 初始化监视器扫描器
    console.info("Initializing watcher and scanner...");
    const { watcher, scanner } = FSLayer();
    this.#docWatcher = watcher;
    this.#docScanner = scanner;
    console.info("Watcher and scanner initialized successfully.");

    // 初始化文档管理器
    console.info("Initializing DocManager...");
    const base = await this.#db.base.get()

    const result = await Promise.allSettled(
      base.map(async ({ path, id, name }) => {
        await this.#startBase({ path, id, name })
        return { id, path }
      })
    )

    // 打印表格
    console.info("DocManager initialized successfully:");
    printAllSettedResult(result)
    console.info("DocBase started successfully.");
  };

  /**
   * 立即扫描所有目录
   */
  scanAllNow = async () => {
    console.info("Starting to scan all directories immediately...");

    const base = await this.#db.base.get()

    printAllSettedResult(await Promise.allSettled(
      base.map(async ({ id, path, name }) => { await this.#scan(id, [path]); return { name } })
    ))

    console.info("All directories scanned immediately.");
  };

  /** 启动 base */
  #startBase = async ({ name, id, path }: Base) => {
    const { meiliSearchConfig } = await this.#db.config.get()
    console.info(`Init base ${name}...`);
    const docm = new DocManager({
      indexPrefix: id,
      meiliSearch: await createMeilisearchClient(meiliSearchConfig),
      docLoader: this.#hyperDocLoader,
      docSplitter: this.#docSplitter.func,
    });
    await docm.init()
    this.#docManagers.set(id, docm)
    console.info(`Base ${name} init successfully.`);

    // 扫描目录
    console.info(`Scanning base ${name}...`);
    await this.#scan(id, [path]);
    console.info(`Base ${name} scanned successfully.`);

    // 监视目录
    this.#docWatcher.watch(path, {
      filter: this.#pathFilterToLoader,
      upsert: (path: string) => {
        this.#watcherTaskCache.set(path, { docManagerId: id, type: "upsert" });
        this.#doWatcherTask();
      },
      remove: (path: string) => {
        this.#watcherTaskCache.set(path, { docManagerId: id, type: "remove" });
        this.#doWatcherTask();
      },
    })
    console.info(`Base ${name} directories are being watched.`);
  }

  /** 添加知识库 */
  addBase = async (name: string) => {
    const base = await this.#db.base.add(name)
    await this.#startBase(base)
  }

  /** 删除知识库 */
  delBase = async (id: string) => {
    const base = await this.#db.base.delete(id)
    await this.#docManagers.get(id).delete()
    this.#docManagers.delete(id)
    return this.#docWatcher.unwatch(base.path)
  }

  /** 获取所有知识库 */
  getBase = async () => await this.#db.base.get()

  /**
   * 卸载文档加载器插件
   * @param docLoaderName - 要卸载的文档加载器名称
   * @throws 如果文档加载器正在使用中会抛出错误
   */
  unLoadDocLoader = async (docLoaderName: string) => {
    console.info(`Attempting to delete document loader: ${docLoaderName}`);
    const using = this.#docExtToLoaderName
      .values()
      .some((v) => v === docLoaderName);

    if (using) {
      const result = { deleted: false, msg: `DocLoader ${docLoaderName} is using.` };
      console.warn(`Failed to delete document loader: ${docLoaderName}. Reason: ${result.msg}`);
      return result;
    }

    const deleted = this.#docLoaders.delete(docLoaderName);
    const result = { deleted };
    console.info(`Document loader deleted: ${docLoaderName}. Result: ${JSON.stringify(result)}`);
    return result;
  };

  /**
   * 为指定扩展名设置文档加载器
   * @param ext - 文档扩展名
   * @param docLoaderName - 文档加载器名称
   * @throws 如果文档加载器不存在或不支持该扩展名会抛出错误
   */
  setDocLoader = async (ext: string, docLoaderName?: string) => {
    console.info(`Attempting to set document loader for extension ${ext}: ${docLoaderName}`);
    if (docLoaderName === undefined) {
      const modified = this.#docExtToLoaderName.delete(ext);
      const result = { modified };
      console.info(`Document loader setting for extension ${ext} updated. Result: ${JSON.stringify(result)}`);
      return result;
    }
    const docLoader = this.#docLoaders.get(docLoaderName);

    if (!docLoader) {
      const result = {
        modified: false,
        msg: `No such docLoaderName ${docLoaderName}`
      };
      console.warn(`Failed to set document loader for extension ${ext}. Reason: ${result.msg}`);
      return result;
    }

    if (!docLoader.exts.includes(ext)) {
      const result = {
        modified: false,
        msg: `${docLoaderName} not support ${ext}`
      };
      console.warn(`Failed to set document loader for extension ${ext}. Reason: ${result.msg}`);
      return result;
    }

    this.#docExtToLoaderName.set(ext, docLoaderName);
    console.info(`Document loader set successfully for extension ${ext}: ${docLoaderName}`);
    return true;
  };

  /**
   * 加载或更新插件
   * @template T - 插件参数类型
   * @param pluginWithConfig - 包含插件和参数的配置对象
   * @throws 如果插件类型错误会抛出错误
   */
  loadPlugin = async <T extends object>(
    pluginWithConfig: PluginWithConfig<T>,
    rescan = true
  ) => {
    console.info(`Loading ${pluginWithConfig.plugin.pluginType} plugin ${pluginWithConfig.plugin.name}`);
    const { plugin, config } = pluginWithConfig;

    plugin.init && await plugin.init(config)

    switch (plugin.pluginType) {
      case "DocLoader":
        this.#docLoaders.set(plugin.name, plugin);

        // 将文档加载器注册到文档加载指向器
        for (const ext of plugin.exts) {
          // 该拓展已经存在文档加载器，不覆盖
          if (!this.#docExtToLoaderName.has(ext)) {
            this.#docExtToLoaderName.set(ext, plugin.name);
          }
        }
        console.info(`Document loader plugin loaded: ${plugin.name}`);
        break;

      case "DocSplitter":
        this.#docSplitter = plugin;
        console.info(`Document splitter plugin loaded: ${plugin.name}`);
        break;

      default:
        const errorMsg = "Plugin type not implemented.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // 立即扫描所有目录
    rescan && this.scanAllNow()
  };

  /**
   * 搜索文档
   * @param query - 搜索查询字符串
   * @param opt - meilisearch 搜索选项
   * @returns 返回搜索结果
   */
  search = async (params?: SearchParams & {
    knowledgeId: string;
  }) => {
    console.info(`Searching for documents with query: ${params.q}`);
    const docManager = this.#docManagers.get(params.knowledgeId)
    const results = await docManager.search(params);
    console.info(`Search completed. Found ${results.length} documents.`);
    return results;
  };

  /**
   * 作为 Dify 外部知识库搜索
   * @param params - Dify 知识库搜索请求参数
   * @returns 返回符合 Dify 格式的搜索结果数组
   */
  difySearch = async (
    params: DifyKnowledgeRequest
  ): Promise<DifyKnowledgeResponseRecord[]> => {
    console.info("Performing Dify search...");
    const q = params.query;
    const { top_k, score_threshold } = params.retrieval_setting;

    const results = await this.search({
      q,
      knowledgeId: params.knowledge_id,
      limit: top_k,
      rankingScoreThreshold: score_threshold,
      showRankingScore: true,
    });

    const difyResults = results.map((i) => ({
      text: i.text,
      score: i._rankingScore,
      title: basename(i.paths.at(0)),
      metadata: {
        paths: i.paths,
      },
    }));
    console.info(`Dify search completed. Found ${difyResults.length} documents.`);
    return difyResults;
  };
}
