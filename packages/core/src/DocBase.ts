import { omit, throttle } from "es-toolkit";
import {
  defaultDocLoaderPlugin,
  type DocLoader,
  type DocLoaderPlugin,
} from "./DocLoader";
import { DocManager, type EmbeddingConfig } from "./DocManager";
import {
  defaultDocSplitterPlugin,
  type DocSplitter,
  type DocSplitterPlugin,
} from "./DocSplitter";
import type { PluginWithParams } from "./Plugin";
import { getExtFromPath, slash } from "./Utils";
import type { Config as MeiliSearchConfig, SearchParams } from "meilisearch";
import { basename } from "path";
import { FSLayer, Scanner, Watcher } from "./FSlayer";
import { AnyZodObject } from "zod";

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

export class DocBase {
  /** 文档管理器 */
  #docManager!: DocManager;

  /** 文档加载指向器，映射文件扩展名到文档加载器名称 */
  #docExtToLoaderName: Map<string, string> = new Map();

  /** 文档加载器，映射文档加载器名称到加载器实例 */
  #docLoaders: Map<string, DocLoaderPlugin & { func: DocLoader }> = new Map();

  /** 文档分割器 */
  #docSplitter!: DocSplitterPlugin & { func: DocSplitter };

  /** 文档扫描器 */
  #docScanner!: Scanner;

  /** 文档监视器 */
  #docWatcher!: Watcher;

  /** 任务缓存器 */
  #watcherTaskCache = new Map<string, "remove" | "upsert">();
  // 节流器默认 500 毫秒
  fileOpThrottleMs: number = 500;

  // 执行任务缓存器中的任务, 每 watcherTaskThrottleMs 毫秒最多执行一次
  #doWatcherTask = throttle(
    async () => {
      console.info("Starting to execute watcher tasks...");
      const results = await Promise.allSettled(
        this.#watcherTaskCache.entries().map(async ([path, type]) => {
          if (type === "upsert") {
            console.info(`Upserting document: ${path}`);
            await this.#docManager.upsertDoc(path);
            console.info(`Document upserted: ${path}`);
          } else if (type === "remove") {
            console.info(`Deleting document: ${path}`);
            await this.#docManager.deleteDocByPath(path);
            console.info(`Document deleted: ${path}`);
          }
        })
      );
      console.info("Watcher tasks execution completed.");
      return results;
    },
    this.fileOpThrottleMs,
    { edges: ["trailing"] }
  );

  /**  获取挂载的知识库目录 */
  get dirs() {
    console.info("Fetching watched directories...");
    const watchedPaths = this.#docWatcher.getWatchedPaths();
    console.info("Watched directories fetched successfully.");
    return watchedPaths;
  }

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
  #hyperDocLoader: DocLoader = async (path) => {
    console.info(`Attempting to load document: ${path}`);
    const ext = getExtFromPath(path);
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

    const document = await dockLoader.func(path);
    console.info(`Document loaded successfully: ${path}`);
    return document;
  };

  /**
   * 扫描指定目录中的文档
   * @param dirs - 要扫描的目录数组
   */
  #scan = async (dirs: string[]) => {
    console.info(`Starting to scan directories: ${dirs.join(', ')}`);
    await this.#docScanner({
      dirs,
      exts: Array.from(this.#docExtToLoaderName.keys()),
      load: async (paths) => {
        console.info(`Loading documents from paths: ${paths.join(', ')}`);
        // 使用 Promise.all 并行处理多个文档插入
        await Promise.all(
          paths.map(async (path) => {
            console.info(`Upserting document during scan: ${path}`);
            await this.#docManager.upsertDoc(path);
            console.info(`Document upserted during scan: ${path}`);
          })
        );
        console.info(`Documents loaded from paths: ${paths.join(', ')}`);
      },
    });
    console.info(`Directories scanned successfully: ${dirs.join(', ')}`);
  };

  /** 启动 docbase */
  start = async ({
    meiliSearchConfig,
    indexPrefix,
    embeddingConfig,
    initPaths = [],
    initPlugins = [
      {
        plugin: defaultDocLoaderPlugin,
        params: {},
      },
      {
        plugin: defaultDocSplitterPlugin,
        params: {
          len: 1000,
        },
      },
    ],
    initscan = true,
    fileOpThrottleMs,
  }: {
    /**
     * MeiliSearch 配置
     */
    meiliSearchConfig: MeiliSearchConfig;
    /**
     * 嵌入模型配置, OPENAI 兼容的配置
     */
    embeddingConfig: EmbeddingConfig;
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
     *   { plugin: defaultDocSplitterPlugin, params: { len: 1000 } }
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
    /**
     * 文件变动时间节流时段(毫秒)，在该时段内每个文件最多执行一次嵌入更新操作
     */
    fileOpThrottleMs?: number;
  }) => {
    console.info("Starting DocBase...");
    this.fileOpThrottleMs = fileOpThrottleMs;
    // 加载所有插件
    // 并行加载所有插件以提高效率
    console.info("Loading all plugins...");
    await Promise.all(
      initPlugins.map((initPlugin) => this.loadPlugin(initPlugin))
    );
    console.info("All plugins loaded successfully.");

    const docSplitterExist = typeof this.#docSplitter.func === "function";
    const docLoadersExist = this.#docLoaders.size > 0;

    // 校验文档监视器、文档扫描器、文档分割器是否存在
    if (!docSplitterExist || !docLoadersExist) {
      const msg = `DocLoaders: ${docLoadersExist} | DocSplitter: ${docSplitterExist}`;
      console.error("Loaded components: \n" + msg);
      throw new Error("Loaded components: \n" + msg);
    }

    // 初始化文档管理器
    console.info("Initializing document manager...");
    this.#docManager = new DocManager({
      indexPrefix,
      meiliSearchConfig,
      embeddingConfig,
      docLoader: (path) => this.#hyperDocLoader(path),
      docSplitter: (text) => this.#docSplitter.func(text),
    });
    await this.#docManager.init();

    // 初始化监视器扫描器
    console.info("Initializing watcher and scanner...");
    const { watcher, scanner } = FSLayer({
      filter: (path: string) => {
        const ext = getExtFromPath(path);
        return this.#docExtToLoaderName.has(ext);
      },
      upsert: (path: string) => {
        this.#watcherTaskCache.set(path, "upsert");
        this.#doWatcherTask();
      },
      remove: (path: string) => {
        this.#watcherTaskCache.set(path, "remove");
        this.#doWatcherTask();
      },
    });
    this.#docWatcher = watcher;
    this.#docScanner = scanner;
    console.info("Watcher and scanner initialized successfully.");

    // 扫描加载默认目录下文档
    if (initscan) {
      console.info("Scanning initial directories...");
      await this.#scan(initPaths);
      console.info("Initial directories scanned successfully.");
    }

    // 开启监视，同步变动文档
    console.info("Starting to watch directories...");
    initPaths.map((initPath) => this.#docWatcher.watch(initPath));
    console.info("Directories are being watched.");
    console.info("DocBase started successfully.");
  };

  /**
   * 立即扫描所有目录
   */
  scanAllNow = async () => {
    console.info("Starting to scan all directories immediately...");
    await this.#scan(this.dirs);
    console.info("All directories scanned immediately.");
  };

  /**
   * 卸载文档加载器插件
   * @param docLoaderName - 要卸载的文档加载器名称
   * @throws 如果文档加载器正在使用中会抛出错误
   */
  delDocLoader = async (docLoaderName: string) => {
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
   * @param pluginWithParams - 包含插件和参数的配置对象
   * @throws 如果插件类型错误会抛出错误
   */
  loadPlugin = async <T extends AnyZodObject>(
    pluginWithParams: PluginWithParams<T>
  ) => {
    console.info(`Loading ${pluginWithParams.plugin.type} plugin ${pluginWithParams.plugin.name}`);
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
        console.info(`Document loader plugin loaded: ${pluginToLoad.name}`);
        break;

      case "DocSplitter":
        this.#docSplitter = pluginToLoad as any;
        console.info(`Document splitter plugin loaded: ${pluginToLoad.name}`);
        break;

      default:
        const errorMsg = "Plugin type not implemented.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
  };

  /**
   * 动态添加知识库目录
   * @param dir - 要添加的目录路径
   */
  addDir = async (dir: string) => {
    console.info(`Adding knowledge base directory: ${dir}`);
    // 扫描并监视
    await this.#scan([dir]);
    this.#docWatcher.watch(dir);
    console.info(`Knowledge base directory added successfully: ${dir}`);
  };

  /**
   * 动态删除知识库目录
   * @param dir - 要删除的目录路径
   * @returns 是否存在 dir
   */
  delDir = async (dir: string) => {
    console.info(`Attempting to delete knowledge base directory: ${dir}`);
    dir = slash(dir);

    // 取消监视
    const hasDir = this.#docWatcher.unwatch(dir);

    // 删除知识库中目录下所有文档
    if (hasDir) {
      console.info(`Deleting documents in directory: ${dir}`);
      await this.#docManager.deleteDocByPathPrefix(dir);
      console.info(`Documents in directory deleted: ${dir}`);
    }

    console.info(`Knowledge base directory deletion result: ${hasDir ? 'Directory deleted.' : 'Directory not found.'}`);
    return hasDir;
  };

  /**
   * 搜索文档
   * @param query - 搜索查询字符串
   * @param opt - meilisearch 搜索选项
   * @returns 返回搜索结果
   */
  search = async (query: string, opt?: Omit<SearchParams, "hybrid">) => {
    console.info(`Searching for documents with query: ${query}`);
    const results = await this.#docManager.search(query, opt);
    console.info(`Search completed. Found ${results.length} documents.`);
    return results;
  };

  /**
   * 作为 Dify 外部知识库搜索
   * @param params - Dify 知识库搜索请求参数
   * @param params.query - 搜索查询字符串
   * @param params.retrieval_setting - 检索设置
   * @param params.retrieval_setting.top_k - 返回结果的最大数量
   * @param params.retrieval_setting.score_threshold - 相关性得分阈值
   * @returns 返回符合 Dify 格式的搜索结果数组
   */
  difySearch = async (
    params: DifyKnowledgeRequest
  ): Promise<DifyKnowledgeResponseRecord[]> => {
    console.info("Performing Dify search...");
    // TODO 多知识库
    // params.knowledge_id;
    const q = params.query;
    const { top_k, score_threshold } = params.retrieval_setting;

    const results = await this.search(q, {
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
