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
import { getExtFromPath } from "./Utils";
import type { Config as MeiliSearchConfig, SearchParams } from "meilisearch";
import { basename } from "path";
import { FSLayer, Scanner, Watcher } from "./FSlayer";
import slash from "slash";
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
  content: string;
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
      return await Promise.allSettled(
        this.#watcherTaskCache.entries().map(async ([path, type]) => {
          if (type === "upsert") {
            await this.#docManager.upsertDoc(path);
          } else if (type === "remove") {
            await this.#docManager.deleteDocByPath(path);
          }
        })
      );
    },
    this.fileOpThrottleMs,
    { edges: ["trailing"] }
  );

  /**  获取挂载的知识库目录 */
  get dirs() {
    return this.#docWatcher.getWatchedPaths();
  }

  /** 获取支持的文档类型 */
  get exts() {
    return this.#docExtToLoaderName.entries();
  }

  /** 获取所有可用文档加载器 */
  get docLoaders() {
    // 去掉 func init
    return Array.from(
      this.#docLoaders.values().map((v) => omit(v, ["func", "init"]))
    );
  }

  get docSplitter() {
    return omit(this.#docSplitter, ["func", "init"]);
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
    await this.#docScanner({
      dirs,
      exts: Array.from(this.#docExtToLoaderName.keys()),
      load: async (paths) => {
        // 使用 Promise.all 并行处理多个文档插入
        await Promise.all(
          paths.map((path) => this.#docManager.upsertDoc(path))
        );
      },
    });
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
    this.fileOpThrottleMs = fileOpThrottleMs;
    // 加载所有插件
    // 并行加载所有插件以提高效率
    await Promise.all(
      initPlugins.map((initPlugin) => this.loadPlugin(initPlugin))
    );

    const docSplitterExist = typeof this.#docSplitter.func === "function";
    const docLoadersExist = this.#docLoaders.size > 0;

    // 校验文档监视器、文档扫描器、文档分割器是否存在
    if (!docSplitterExist || !docLoadersExist) {
      const msg = `DocLoaders: ${docLoadersExist} | DocSplitter: ${docSplitterExist}`;
      throw new Error("Loaded components: \n" + msg);
    }

    // 初始化文档管理器
    this.#docManager = new DocManager({
      indexPrefix,
      meiliSearchConfig,
      embeddingConfig,
      docLoader: (path) => this.#hyperDocLoader(path),
      docSplitter: (text) => this.#docSplitter.func(text),
    });
    await this.#docManager.init();

    // 初始化监视器扫描器
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

    // 扫描加载默认目录下文档
    if (initscan) {
      await this.#scan(initPaths);
    }

    // 开启监视，同步变动文档
    initPaths.map((initPath) => this.#docWatcher.watch(initPath));
  };

  /**
   * 立即扫描所有目录
   */
  scanAllNow = async () => await this.#scan(this.dirs);

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
      return {
        modified: false,
        msg: `No such docLoaderName ${docLoaderName}`
      }
    }

    if (!docLoader.exts.includes(ext)) {
      return {
        modified: false,
        msg: `${docLoaderName} not support ${ext}`
      }
    }

    this.#docExtToLoaderName.set(ext, docLoaderName);
    return true
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

      case "DocSplitter":
        this.#docSplitter = pluginToLoad as any;
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
    this.#docWatcher.watch(dir);
  };

  /**
   * 动态删除知识库目录
   * @param dir - 要删除的目录路径
   * @returns 是否存在 dir
   */
  delDir = async (dir: string) => {
    dir = slash(dir);

    // 取消监视
    const hasDir = this.#docWatcher.unwatch(dir);

    // 删除知识库中目录下所有文档
    if (hasDir) {
      await this.#docManager.deleteDocByPathPrefix(dir);
    }

    return hasDir;
  };

  /**
   * 搜索文档
   * @param query - 搜索查询字符串
   * @param opt - meilisearch 搜索选项
   * @returns 返回搜索结果
   */
  search = async (query: string, opt?: Omit<SearchParams, "hybrid">) =>
    await this.#docManager.search(query, opt);

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
    // TODO 多知识库
    // params.knowledge_id;
    const q = params.query;
    const { top_k, score_threshold } = params.retrieval_setting;

    const results = await this.search(q, {
      limit: top_k,
      rankingScoreThreshold: score_threshold,
      showRankingScore: true,
    });

    return results.map((i) => ({
      content: i.content,
      score: i._rankingScore,
      title: basename(i.paths.at(0)),
      metadata: {
        paths: i.paths,
      },
    }));
  };
}
