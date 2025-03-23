/**
 * 文档类型
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
  text: string;
  /** 自定义向量 */
  _vectors?: {
    [key: string]: number[];
  }
}

import { Index, MeiliSearch } from "meilisearch";
import type { DocLoader } from "./DocLoader";
import type { DocSplitter } from "./DocSplitter";
import { xxhash64 } from "hash-wasm";
import { exists, stat } from "fs-extra";
import { compact, difference, merge, retry } from "es-toolkit";
import type { Embedders, Config, SearchParams } from "meilisearch";
import { AsyncStream } from "itertools-ts";

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

/**
 * 基于 MeiliSearch 实现的文档管理器
 */
export class DocManager {
  /** MeiliSearch 客户端实例 */
  #client: MeiliSearch;

  /** 索引版本 */
  #indexVersion = "v0";
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
    docLoader,
    docSplitter,
    indexPrefix = "",
  }: {
    meiliSearchConfig: Config;
    docLoader: DocLoader;
    docSplitter: DocSplitter;
    indexPrefix?: string;
  }) {
    this.#client = new MeiliSearch(meiliSearchConfig);
    this.#docLoader = docLoader;
    this.#docSplitter = docSplitter;
    const prefix = compact([indexPrefix, this.#indexVersion]).join("_");
    this.#indexPrefix = `${prefix}-`;
    console.info(`DocManager initialized with index prefix: ${this.#indexPrefix}`);
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
      console.info(`Index ${uid} retrieved successfully`);
    } catch (error) {
      if ((error as Error).message === `Index \`${uid}\` not found.`) {
        console.warn(`Index ${uid} not found, creating it...`);
        const task = await this.#client.createIndex(uid, { primaryKey });
        await this.#client.waitForTask(task.taskUid);
        console.info(`Index ${uid} created successfully`);
      } else {
        console.error(`Error retrieving or creating index ${uid}:`, error);
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
    console.debug(`Getting related docs count for chunk ${chunkHash}`);
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
  async #getChunkRelatedDocs(chunkHash: string) {
    console.debug(`Getting related docs for chunk ${chunkHash}`);
    const filter = `chunkHashs IN ["${chunkHash}"]`
    // 初始大小
    const initSize = 1000;
    // 获取文档
    const docs = await this.#docIndex.getDocuments({
      filter,
      limit: initSize
    });

    if (docs.total <= initSize) {
      return docs.results
    } else {
      const allDocs = await this.#docIndex.getDocuments({
        filter,
        limit: docs.total
      });
      return allDocs.results
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
        console.debug("Trying to ensure ContainsFilter feature is on");
        const res = await fetch(`${host}/experimental-features`, {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        });

        const { containsFilter } = await res.json();

        if (!containsFilter) {
          console.warn("ContainsFilter feature is off, turning it on...");
          await fetch(`${host}/experimental-features`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ containsFilter: true }),
          });
          console.info("ContainsFilter feature turned on successfully");
        } else {
          console.debug("ContainsFilter feature is on");
        }
      },
      { retries: 3, delay: 3000 }
    );
  };

  /**
   * 初始化文档管理器
   */
  init = async () => {
    console.info("Initializing DocManager...");
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
      console.info(
        `Creating filterable attributes for doc index: ${docIndexFilterableAttributesNeedCreate}`
      );
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

    console.info("DocManager initialized successfully");
  };

  /** 获取已有 embedders */
  getEmbedders = async () => await this.#docChunkIndex.getEmbedders()

  /** 重置已有 embedders */
  resetEmbedders = async (wait = false) => {
    const task = await this.#docChunkIndex.resetEmbedders()
    if (wait) {
      await this.#docChunkIndex.waitForTask(task.taskUid)
    }
  }

  /** 增删改 embedders */
  updateEmbedders = async (embedders: Embedders, wait = false) => {
    const task = await this.#docChunkIndex.updateEmbedders(embedders)
    if (wait) {
      await this.#docChunkIndex.waitForTask(task.taskUid)
    }
  }

  /**
   * 安全获取文档，如果不存在返回 false
   * @param hash - 文档 hash
   * @returns 返回文档实例或 false
   */
  #getDocIfExist = async (hash: string): Promise<DocDocument | false> => {
    console.debug(`Checking if document ${hash} exists`);
    try {
      const res = await this.#docIndex.getDocument(hash);
      return res;
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === `Document \`${hash}\` not found.`) {
        console.debug(`Document ${hash} not found`);
        return false;
      } else {
        console.error(`Error getting document ${hash}:`, error);
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
    console.debug(`Checking if document at path ${path} exists`);
    const docs = await this.#docIndex.getDocuments({
      filter: `path = "${path}"`,
    });

    if (docs.total > 0) {
      console.debug(`Document at path ${path} found`);
      return docs.results[0];
    } else {
      console.debug(`Document at path ${path} not found`);
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
        console.info(`Uploading new document: ${localDoc.path}`);
        docSyncContent = await getDocSyncContent(localDoc.chunkHashs);
      } else {
        // 文档已落后
        console.info(`Document at path ${localDoc.path} is outdated, updating...`);
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

      console.info(`[Embedded ${docSyncContent.length} chunks] ${localDoc.path}`);
    } else {
      console.info(`[Skipped] ${localDoc.path}`);
      // 文档存在
      if (!(remoteDocByHash.path === localDoc.path)) {
        // path 错误
        const oldPathFileExists = await exists(remoteDocByHash.path);
        if (!oldPathFileExists) {
          // 更新 path
          console.info(`Updating document path from ${remoteDocByHash.path} to ${localDoc.path}`);
          await this.#docIndex.updateDocuments([
            { hash: remoteDocByHash.hash, path: localDoc.path },
          ]);
        }
      }
    }
  };

  upsertDoc = async (path: string) => {
    // 查询该路径有无文档
    const [{ mtimeMs }, remoteDocByPath] = await Promise.all([
      stat(path),
      this.#getDocByPathIfExist(path),
    ]);

    // 如果有且修改时间相等则为已上传过，直接跳过
    if (remoteDocByPath && remoteDocByPath.updateAt === mtimeMs) {
      console.debug(`Document at path ${path} is already up-to-date, skipping...`);
      return;
    }

    // 加载内容 Promise
    const doc = await this.#docLoader({ path, hash: xxhash64 });

    if (doc) {
      const { hash, content } = doc

      // 分割内容
      const chunks = this.#docSplitter(content);

      // 并行构造所有 chunks
      const docChunks: DocChunkDocument[] = await AsyncStream.of(chunks)
        .map(async (chunk) => {
          const chunkHash = await xxhash64(chunk.text);
          return {
            hash: chunkHash,
            ...chunk
          }
        })
        .toArray();

      // 收集所有 chunk hash
      const chunkHashs = new Set<string>(docChunks.map((chunk) => chunk.hash));

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

    if (needDeleteChunkHashs.length > 0) {
      console.info(`Deleting chunks: ${needDeleteChunkHashs}`);
      // 删除 chunk
      await this.#docChunkIndex.deleteDocuments(needDeleteChunkHashs);
    }
  };

  #deleteDoc = async (doc: DocDocument) => {
    console.info(`Deleting document: ${doc.path}`);
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
    console.info(`Deleting document at path: ${path}`);
    const doc = await this.#getDocByPathIfExist(path);

    if (doc) {
      await this.#deleteDoc(doc);
    } else {
      console.debug(`Document at path ${path} not found, skipping deletion...`);
    }
  };

  /**
   * 删除目录下所有文档
   * @param path - 目录路径
   */
  deleteDocByPathPrefix = async (path: string) => {
    console.info(`Deleting all documents under path prefix: ${path}`);
    const getDocs = async () =>
      await this.#docIndex.getDocuments({
        filter: `path STARTS WITH "${path}"`,
      });

    while (true) {
      // 获取文档
      const docs = await getDocs();

      // 没有文档则结束
      if (docs.total === 0) {
        console.debug(`No documents found under path prefix ${path}, stopping deletion...`);
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
    console.info(`Deleting document with hash: ${hash}`);
    const doc = await this.#getDocIfExist(hash);

    if (doc) {
      await this.#deleteDoc(doc);
    } else {
      console.debug(`Document with hash ${hash} not found, skipping deletion...`);
    }
  };

  /**
   * 搜索文档
   * @param query - 搜索查询
   * @param hybrid - 启用向量搜索
   * @returns 返回搜索结果
   */
  search = async (query: string, opts?: SearchParams) => {
    console.debug(`Searching for query: ${query}`);
    const result = await this.#docChunkIndex.search(query, opts);
    const hits = result.hits;

    // 查询后校验结果中引用到的本地文档是否存在，不存在则删除知识库内文档
    // 自动删除文档, 防止停止运行时用户偷偷删除文档
    const validHits = await Promise.all(
      hits.map(async (hit) => {
        const docs = await this.#getChunkRelatedDocs(hit.hash);
        let validDoc = false;
        const paths: string[] = [];

        // 并行检查文档是否存在
        const docChecks: Promise<boolean>[] = [];
        for (const doc of docs) {
          docChecks.push(
            exists(doc.path).then((exists) => {
              if (!exists) {
                // 异步删除无效文档
                console.info(`Deleting invalid document with hash ${doc.hash}`);
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
