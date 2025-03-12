/**
 * 文档类型
 * chunkHashs 换成 Set 提高性能
 */
export interface Doc {
  /** 文档 hash */
  hash: string;
  /** 文档路径 */
  path: string;
  // 文件修改时间戳
  updateAt: number;
  /** 文档 chunkHash 集合 */
  chunkHashs: Set<string>;
}

/**
 * 文档索引类型
 */
export type DocDocument = Omit<Doc, "chunkHashs"> & { chunkHashs: string[] };

/**
 * 文档 chunk 索引类型
 */
export interface DocChunkDocument {
  /** 内容 hash */
  hash: string;
  /** 内容 */
  content: string;
}

import { Index, MeiliSearch } from "meilisearch";
import type { DocLoader } from "./DocLoader";
import type { DocSplitter } from "./DocSplitter";
import { xxhash64 } from "hash-wasm";
import { exists, stat } from "fs-extra";
import { compact, difference, merge, retry } from "es-toolkit";
import slash from "slash";
import type { Config as MeiliSearchConfig, SearchParams } from "meilisearch";

// 从新旧 chunks 计算需要执行的操作
export const chunkDiff = (
  remoteChunkHashs: Set<string>,
  incomingChunkHashs: Set<string>
) => {
  const needAddChunkHashs = incomingChunkHashs.difference(remoteChunkHashs);
  const needDeleteChunkHashs = remoteChunkHashs.difference(incomingChunkHashs);

  return {
    // 需要删除的旧 chunk
    needDeleteChunkHashs,
    // 需要添加的新 chunk
    needAddChunkHashs,
  };
};

// openai 嵌入标准
export interface EmbeddingConfig {
  model: string;
  url: string;
  apiKey: string;
  dimensions: number;
}

/**
 * 基于 MeiliSearch 实现的文档管理器
 */
export class DocManager {
  /** MeiliSearch 客户端实例 */
  #client: MeiliSearch;

  /** 索引前缀 */
  #indexPrefix: string;
  /** 文档 Chunk 索引 */
  #docChunkIndex!: Index<DocChunkDocument>;
  /** 文档索引 */
  #docIndex!: Index<DocDocument>;

  /** 文档加载器 */
  #docLoader: DocLoader;
  /** 文档分割器 */
  #docSplitter: DocSplitter;
  #embeddingConfig: EmbeddingConfig;

  /**
   * 构造函数
   * @param options - 配置选项
   * @param options.meiliSearchConfig - MeiliSearch 配置
   * @param options.docLoader - 文档加载器
   * @param options.docSplitter - 文档分割器
   * @param options.indexPrefix - 索引前缀，默认为空字符串
   */
  constructor({
    meiliSearchConfig,
    embeddingConfig,
    docLoader,
    docSplitter,
    indexPrefix = "",
  }: {
    meiliSearchConfig: MeiliSearchConfig;
    embeddingConfig: EmbeddingConfig;
    docLoader: DocLoader;
    docSplitter: DocSplitter;
    indexPrefix?: string;
  }) {
    this.#client = new MeiliSearch(meiliSearchConfig);
    this.#docLoader = docLoader;
    this.#docSplitter = docSplitter;
    this.#indexPrefix = indexPrefix;
    this.#embeddingConfig = embeddingConfig;
  }

  /**
   * 安全获取索引，如果不存在则创建
   * @param uid - 索引唯一标识
   * @param primaryKey - 主键，默认为"hash"
   * @returns 返回索引实例
   */
  #getIndexOrCreate = async (uid: string, primaryKey: string = "hash") => {
    const index = this.#client.index(uid);
    try {
      await this.#client.getIndex(uid);
    } catch (error) {
      if ((error as Error).message === `Index \`${uid}\` not found.`) {
        const task = await this.#client.createIndex(uid, { primaryKey });
        await this.#client.waitForTask(task.taskUid);
      } else {
        throw error;
      }
    }
    return index;
  };

  /**
   * 获取 chunk 关联的文档数量
   * @param chunkHash - chunk hash
   * @returns 返回关联的文档数量
   */
  // TODO 性能优化：批量获取
  #getChunkRelatedDocsCount = async (chunkHash: string) => {
    const docs = await this.#docIndex.getDocuments({
      filter: `chunkHashs IN ["${chunkHash}"]`,
      limit: 0,
    });

    return docs.total;
  };

  /**
   * 获取 chunk 关联的文档
   * @param chunkHash - chunk hash
   * @yields 返回关联的文档
   */
  // TODO 性能优化：一次性全部获取、批量获取
  async *#getChunkRelatedDocs(chunkHash: string) {
    const batchSize = 100; // 每次获取的文档数量
    let offset = 0;

    while (true) {
      const docs = await this.#docIndex.getDocuments({
        filter: `chunkHashs IN ["${chunkHash}"]`,
        limit: batchSize,
        offset,
      });

      yield* docs.results;
      offset += batchSize;

      if (offset >= docs.total) {
        break;
      }
    }
  }

  /**
   * 确保 ContainsFilter 功能开启
   */
  // https://www.meilisearch.com/docs/learn/filtering_and_sorting/filter_expression_reference#contains
  #ensureContainsFilterFeatureOn = async () => {
    const host = this.#client.config.host;
    const key = this.#client.config.apiKey;

    // 尝试并等待 meilisearch 启动
    await retry(
      async () => {
        const res = await fetch(`${host}/experimental-features`, {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        });

        const { containsFilter } = await res.json();

        if (!containsFilter) {
          await fetch(`${host}/experimental-features`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ containsFilter: true }),
          });
        }
      },
      { retries: 3, delay: 3000 }
    );
  };

  /**
   * 初始化文档管理器
   */
  init = async () => {
    await this.#ensureContainsFilterFeatureOn();

    this.#docIndex = await this.#getIndexOrCreate(`${this.#indexPrefix}docs`);

    // 获取已有的可筛选属性
    const docIndexFilterableAttributes =
      await this.#docIndex.getFilterableAttributes();

    // 需要设置的可筛选的属性
    const docIndexFilterableAttributesNeedCreate = difference(
      ["path", "chunkHashs"],
      docIndexFilterableAttributes
    );

    // 设置可筛选属性
    if (docIndexFilterableAttributesNeedCreate.length > 0) {
      await this.#docIndex.updateSettings({
        filterableAttributes: [
          ...docIndexFilterableAttributes,
          ...docIndexFilterableAttributesNeedCreate,
        ],
      });
    }

    this.#docChunkIndex = await this.#getIndexOrCreate(
      `${this.#indexPrefix}chunks`
    );

    const embedders = await this.#docChunkIndex.getEmbedders();

    // 无该 embedders 新增
    if (
      !(
        embedders &&
        Object.keys(embedders).includes(this.#embeddingConfig.model)
      )
    ) {
      await this.#docChunkIndex.updateEmbedders({
        [this.#embeddingConfig.model]: {
          source: "rest",
          url: this.#embeddingConfig.url,
          apiKey: this.#embeddingConfig.apiKey,
          dimensions: this.#embeddingConfig.dimensions,
          request: {
            input: "{{text}}",
            model: this.#embeddingConfig.model,
          },
          response: {
            data: [
              {
                embedding: "{{embedding}}",
              },
            ],
          },
        },
      });
    }
  };

  /**
   * 安全获取文档，如果不存在返回 false
   * @param hash - 文档 hash
   * @returns 返回文档实例或 false
   */
  #getDocIfExist = async (hash: string): Promise<DocDocument | false> => {
    try {
      const res = await this.#docIndex.getDocument(hash);
      return res;
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === `Document \`${hash}\` not found.`) {
        return false;
      } else {
        throw error;
      }
    }
  };

  /**
   * 通过路径获取文档，如果不存在返回 false
   * @param path - 文档路径
   * @returns 返回文档实例或 false
   */
  #getDocByPathIfExist = async (path: string): Promise<DocDocument | false> => {
    const docs = await this.#docIndex.getDocuments({
      filter: `path = "${path}"`,
    });

    if (docs.total > 0) {
      return docs.results[0];
    } else {
      return false;
    }
  };

  #convertDoc2DocDocument = (doc: Doc): DocDocument =>
    merge(doc, { chunkHashs: doc.chunkHashs.values().toArray() });
  #convertDocDocument2Doc = (doc: DocDocument): Doc =>
    merge(doc, { chunkHashs: new Set(doc.chunkHashs) });

  /**
   * 文档上传器，用于自动增删文档
   * @param remoteDocByHash - 按 Hash 检索的远程文档
   * @param remoteDocByPath - 按路径检索的远程文档
   * @param localDoc - 文档差异请求
   * @function getDocSyncContent - 获取需要同步的文档内容
   */
  // 根据文档路径、hash 查找文档是否存在、是否修改过
  // hash 存在 -> 文档存在
  //     path 正确 -> 什么都不做
  //     path 错误
  //         原 path 无文件 -> 文件移动, 覆盖更新 path
  //         原 path 有文件 -> 文件重复, 什么都不做

  // hash 不存在 -> 文档不存在 | 文档已落后
  //     path 存在 文档已落后 -> 更新文档
  //     path 不存在 文档不存在 -> 增加文档
  #upload = async ({
    remoteDocByHash,
    remoteDocByPath,
    localDoc,
    getDocSyncContent,
  }: {
    remoteDocByHash: Doc | false;
    remoteDocByPath: Doc | false;
    localDoc: Doc;
    getDocSyncContent: (
      needAddChunkHashs: Set<string>
    ) => Promise<DocChunkDocument[]>;
  }) => {
    if (!remoteDocByHash) {
      let docSyncContent: DocChunkDocument[];

      if (!remoteDocByPath) {
        // 需要上传的所有 chunk
        docSyncContent = await getDocSyncContent(localDoc.chunkHashs);
      } else {
        // 文档已落后
        const remoteChunkHashs = remoteDocByPath.chunkHashs;
        const incomingChunkHashs = localDoc.chunkHashs;

        const {
          // 需要删除的旧 chunk
          needDeleteChunkHashs,
          // 需要添加的新 chunk
          needAddChunkHashs,
        } = chunkDiff(remoteChunkHashs, incomingChunkHashs);

        // 并行执行删除和获取内容的操作
        [, , docSyncContent] = await Promise.all([
          // 删除旧 chunk
          this.#deleteChunks(needDeleteChunkHashs.values().toArray()),
          // 删除旧 doc
          this.#docIndex.deleteDocument(remoteDocByPath.hash),
          // 需要上传的所有 chunk
          getDocSyncContent(needAddChunkHashs),
        ]);
      }

      // 并行执行添加文档和 chunk 的操作
      await Promise.all([
        // 增加新 doc
        this.#docIndex.addDocuments([this.#convertDoc2DocDocument(localDoc)]),
        // 添加新 chunk
        this.#docChunkIndex.addDocuments(docSyncContent),
      ]);
    } else {
      // 文档存在
      if (!(remoteDocByHash.path === localDoc.path)) {
        // path 错误
        const oldPathFileExists = await exists(remoteDocByHash.path);
        if (!oldPathFileExists) {
          // 更新 path
          await this.#docIndex.updateDocuments([
            { hash: remoteDocByHash.hash, path: localDoc.path },
          ]);
        }
      }
    }
  };

  upsertDoc = async (path: string) => {
    path = slash(path);

    // 加载内容 Promise
    const docToLoad = this.#docLoader(path);

    if (docToLoad !== false) {
      // 修改时间
      // 查询该路径有无文档
      const [{ mtimeMs }, remoteDocByPath] = await Promise.all([
        stat(path),
        this.#getDocByPathIfExist(path),
      ]);

      // 如果有且修改时间相等则为已上传过，直接跳过
      if (remoteDocByPath && remoteDocByPath.updateAt === mtimeMs) {
        return;
      }

      // 实际加载文档
      const doc = await docToLoad;

      if (doc !== false) {
        const { content } = doc;

        // 分割内容
        const chunks = await this.#docSplitter(content);

        const docChunks: DocChunkDocument[] = new Array(chunks.length);
        const chunkHashs = new Set<string>();

        // 并行构造所有 chunks
        await Promise.all(
          chunks.map(async (chunk, index) => {
            const chunkHash = await xxhash64(chunk);
            chunkHashs.add(chunkHash);
            docChunks[index] = {
              hash: chunkHash,
              content: chunk,
            };
          })
        );

        // 计算文档总 hash
        const hash = await xxhash64(docChunks.map((i) => i.hash).join(""));

        // 构造文档同步请求
        const localDoc: Doc = {
          path,
          hash,
          chunkHashs,
          updateAt: mtimeMs,
        };

        // 获取需要上传的 chunks
        const getDocSyncContent = async (
          needAddChunkHashs: Set<string>
        ): Promise<DocChunkDocument[]> =>
          docChunks.filter((chunk) => needAddChunkHashs.has(chunk.hash));

        // 获取远程文档
        const remoteDocByHash = await this.#getDocIfExist(hash);

        // 上传知识库
        await this.#upload({
          remoteDocByHash: remoteDocByHash
            ? this.#convertDocDocument2Doc(remoteDocByHash)
            : false,
          remoteDocByPath: remoteDocByPath
            ? this.#convertDocDocument2Doc(remoteDocByPath)
            : false,
          localDoc,
          getDocSyncContent,
        });
      }
    }
  };

  #deleteChunks = async (chunkHashs: string[]) => {
    const needDeleteChunkHashs = compact(
      await Promise.all(
        chunkHashs.map(async (chunkHash) => {
          // 获取 chunk 关联的文档数量
          const relatedDocsCount = await this.#getChunkRelatedDocsCount(
            chunkHash
          );

          // 如果关联到 2 个以上文档, 则不删除
          if (relatedDocsCount <= 1) {
            return chunkHash;
          }
        })
      )
    );

    // 删除 chunk
    await this.#docChunkIndex.deleteDocuments(needDeleteChunkHashs);
  };

  #deleteDoc = async (doc: DocDocument) => {
    // 并行删除内容和文档
    await Promise.all([
      // 删除内容
      this.#deleteChunks(doc.chunkHashs),
      // 删除文档
      this.#docIndex.deleteDocument(doc.hash),
    ]);
  };

  /**
   * 按路径删除文档
   * @param path - 文档路径
   */
  deleteDocByPath = async (path: string) => {
    path = slash(path);
    const doc = await this.#getDocByPathIfExist(path);

    if (doc) {
      await this.#deleteDoc(doc);
    }
  };

  /**
   * 删除目录下所有文档
   * @param path - 目录路径
   */
  deleteDocByPathPrefix = async (path: string) => {
    path = slash(path);

    const getDocs = async () =>
      await this.#docIndex.getDocuments({
        filter: `path STARTS WITH "${path}"`,
      });

    while (true) {
      // 获取文档
      const docs = await getDocs();

      // 没有文档则结束
      if (docs.total === 0) {
        break;
      }

      // 删除文档
      const delteTasks = docs.results.map((doc) => this.#deleteDoc(doc));
      // 等待删除完成
      await Promise.all(delteTasks);
    }
  };

  /**
   * 按 hash 删除文档
   * @param hash - 文档 hash
   */
  deleteDocByHash = async (hash: string) => {
    const doc = await this.#getDocIfExist(hash);

    if (doc) {
      await this.#deleteDoc(doc);
    }
  };

  /**
   * 搜索文档
   * @param query - 搜索查询
   * @param hybrid - 启用向量搜索
   * @returns 返回搜索结果
   */
  search = async (query: string, opts?: Omit<SearchParams, "hybrid">) => {
    const result = await this.#docChunkIndex.search(query, {
      ...opts,
      hybrid: {
        // 使用指定嵌入模型
        embedder: this.#embeddingConfig.model,
      },
    });
    const hits = result.hits;

    // 查询后校验结果中引用到的本地文档是否存在，不存在则删除知识库内文档
    // 自动删除文档, 防止停止运行时用户偷偷删除文档
    const validHits = await Promise.all(
      hits.map(async (hit) => {
        const docs = this.#getChunkRelatedDocs(hit.hash);
        let validDoc = false;
        const paths: string[] = [];

        // 并行检查文档是否存在
        const docChecks: Promise<boolean>[] = [];
        for await (const doc of docs) {
          docChecks.push(
            exists(doc.path).then((exists) => {
              if (!exists) {
                // 异步删除无效文档
                this.deleteDocByHash(doc.hash);
              }
              paths.push(doc.path);
              return exists;
            })
          );
        }

        // 等待所有检查完成
        const results = await Promise.all(docChecks);
        validDoc = results.some((exists) => exists === true);

        if (validDoc) {
          return merge(hit, { paths });
        }
        return null;
      })
    );

    // 过滤掉无效的结果
    return validHits.filter(Boolean);
  };
}
