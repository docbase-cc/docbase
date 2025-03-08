/**
 * 文档索引类型
 */
export interface DocDocument {
  /** 文档 hash */
  hash: string;
  /** 文档路径 */
  path: string;
  /** 文档 chunkHash 数组 */
  chunkHashs: string[];
}

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
import { exists } from "fs-extra";
import { difference, merge, retry } from "es-toolkit";
import slash from "slash";
import type { Config as MeiliSearchConfig, SearchParams } from "meilisearch";

// 从新旧 chunks 计算需要执行的操作
export const chunkDiff = (
  remoteChunkHashs: string[],
  incomingChunkHashs: string[]
) => {
  const needAddChunkHashs = difference(incomingChunkHashs, remoteChunkHashs);
  const needDeleteChunkHashs = difference(remoteChunkHashs, incomingChunkHashs);

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
      return (await this.#docIndex.getDocument(hash)) as DocDocument;
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
      return docs.results[0] as DocDocument;
    } else {
      return false;
    }
  };

  /**
   * 文档上传器，用于自动增删文档
   * @param docDiffReq - 文档差异请求
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
  #upload = async (
    docDiffReq: DocDocument,
    getDocSyncContent: (
      needAddChunkHashs: string[]
    ) => Promise<DocChunkDocument[]>
  ) => {
    const remoteDoc = await this.#getDocIfExist(docDiffReq.hash);

    if (!remoteDoc) {
      // 查找知识库中有无该 path 的文档
      const remoteDocByPath = await this.#getDocByPathIfExist(docDiffReq.path);
      let docSyncContent: DocChunkDocument[];

      if (!remoteDocByPath) {
        // 文档不存在
        await this.#docIndex.addDocuments([docDiffReq]);

        // 需要上传的所有 chunk
        docSyncContent = await getDocSyncContent(docDiffReq.chunkHashs);
      } else {
        // 文档已落后
        const remoteChunkHashs = remoteDocByPath.chunkHashs;
        const incomingChunkHashs = docDiffReq.chunkHashs;

        const {
          // 需要删除的旧 chunk
          needDeleteChunkHashs,
          // 需要添加的新 chunk
          needAddChunkHashs,
        } = chunkDiff(remoteChunkHashs, incomingChunkHashs);

        // 删除旧 chunk
        await this.#deleteChunks(needDeleteChunkHashs);

        // 删除旧 doc
        await this.#docIndex.deleteDocument(remoteDocByPath.hash);

        // 增加新 doc
        await this.#docIndex.addDocuments([docDiffReq]);

        // 需要上传的所有 chunk
        docSyncContent = await getDocSyncContent(needAddChunkHashs);
      }

      // 添加新 chunk
      await this.#docChunkIndex.addDocuments(docSyncContent);
    } else {
      // 文档存在
      if (!(remoteDoc.path === docDiffReq.path)) {
        // path 错误
        const oldPathFileExists = await exists(remoteDoc.path);
        if (!oldPathFileExists) {
          // 更新 path
          await this.#docIndex.updateDocuments([
            { hash: remoteDoc.hash, path: docDiffReq.path },
          ]);
        }
      }
    }
  };

  upsertDoc = async (path: string) => {
    path = slash(path);
    // 加载内容
    const content = await this.#docLoader(path);
    // 分割内容
    const chunks = await this.#docSplitter(content);
    // 添加 hash
    const docChunks: DocChunkDocument[] = [];
    const chunkHashs: string[] = [];

    // 构造 chunk
    for (const chunk of chunks) {
      const chunkHash = await xxhash64(chunk);
      chunkHashs.push(chunkHash);
      docChunks.push({
        hash: chunkHash,
        content: chunk,
      });
    }

    // 构造文档同步请求
    const docDiffReq: DocDocument = {
      path,
      hash: await xxhash64(chunkHashs.join()),
      chunkHashs: chunkHashs,
    };

    // 文档提交请求构造器
    const getDocSyncContent = async (
      needAddChunkHashs: string[]
    ): Promise<DocChunkDocument[]> => {
      const chunksNeedAdd: DocChunkDocument[] = [];

      for (const docChunk of docChunks) {
        if (needAddChunkHashs.includes(docChunk.hash)) {
          chunksNeedAdd.push(docChunk);
        }
      }

      return chunksNeedAdd;
    };

    // 上传知识库
    await this.#upload(docDiffReq, getDocSyncContent);
  };

  #deleteChunks = async (chunkHashs: string[]) => {
    const needDeleteChunkHashs: string[] = [];

    for (const chunkHash of chunkHashs) {
      // 获取 chunk 关联的文档数量
      const relatedDocsCount = await this.#getChunkRelatedDocsCount(chunkHash);

      // 如果关联到 2 个以上文档, 则不删除
      if (relatedDocsCount <= 1) {
        needDeleteChunkHashs.push(chunkHash);
      }
    }

    // 删除 chunk
    await this.#docChunkIndex.deleteDocuments(needDeleteChunkHashs);
  };

  #deleteDoc = async (doc: DocDocument) => {
    // 删除内容
    await this.#deleteChunks(doc.chunkHashs);

    // 删除文档
    await this.#docIndex.deleteDocument(doc.hash);
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
      for (const doc of docs.results) {
        await this.#deleteDoc(doc);
      }
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
    const outs: ((typeof hits)[0] & { paths: string[] })[] = [];

    // 查询后校验结果中引用到的本地文档是否存在，不存在则删除知识库内文档
    // 自动删除文档, 防止停止运行时用户偷偷删除文档
    for (const hit of hits) {
      const docs = this.#getChunkRelatedDocs(hit.hash);
      let validDoc = false;
      let paths: string[] = [];
      for await (const doc of docs) {
        const docExists = await exists(doc.path);
        if (!docExists) {
          // 异步删除
          this.deleteDocByHash(doc.hash);
        } else {
          validDoc = true;
          paths.push(doc.path);
        }
      }
      if (validDoc) outs.push(merge(hit, { paths }));
    }

    return outs;
  };
}
