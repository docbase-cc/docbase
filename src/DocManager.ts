// 文档索引类型
export interface DocDocument {
  // 文档 hash
  hash: string;
  // 文档路径
  path: string;
  // 文档 chunkHash
  chunkHashs: string[];
}

// 文档 chunk 索引类型
export interface DocChunkDocument {
  // 内容 hash
  hash: string;
  // 内容
  content: string;
  // 文档路径
  docPath: string;
}

import { Index, MeiliSearch } from "meilisearch";
import type { DocLoader } from "./DocLoader";
import type { DocSplitter } from "./DocSplitter";
import { xxhash64 } from "hash-wasm";
import { exists } from "fs-extra";
import { difference } from "es-toolkit";
import slash from "slash";

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

// 基于 meilisearch 实现文档管理器
export class DocManager {
  #client: MeiliSearch;

  // 文档 Chunk 索引
  #docChunkIndex!: Index<DocChunkDocument>;
  // 文档索引
  #docIndex!: Index<DocDocument>;

  // 文档加载器（已根据 path 拓展名分流过的）
  #docLoader: DocLoader;
  // 文档分割器
  #docSplitter: DocSplitter;

  constructor({
    host,
    apiKey,
    docLoader,
    docSplitter,
  }: {
    // meilisearch host
    host: string;
    // meilisearch apiKey
    apiKey: string;
    docLoader: DocLoader;
    docSplitter: DocSplitter;
  }) {
    this.#client = new MeiliSearch({
      host,
      apiKey,
    });
    this.#docLoader = docLoader;
    this.#docSplitter = docSplitter;
  }

  // 安全获取索引
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

  // 初始化
  init = async () => {
    this.#docIndex = await this.#getIndexOrCreate("docs");

    const docIndexFilterableAttributes =
      await this.#docIndex.getFilterableAttributes();

    if (!docIndexFilterableAttributes.includes("path")) {
      await this.#docIndex.updateSettings({
        filterableAttributes: [...docIndexFilterableAttributes, "path"],
      });
    }

    this.#docChunkIndex = await this.#getIndexOrCreate("chunks");
  };

  // 安全获取文档
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

  // 通过 path 获取文档
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

  // 文档上传器
  // 用于自动增删文档
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
        await this.#deleteChunks(remoteDocByPath.hash, needDeleteChunkHashs);

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
        docPath: path,
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
          chunksNeedAdd.push({
            ...docChunk,
            docPath: path,
          });
        }
      }

      return chunksNeedAdd;
    };

    // 上传知识库
    await this.#upload(docDiffReq, getDocSyncContent);
  };

  #deleteChunks = async (docHash: string, chunkHashs: string[]) => {
    // TODO 只删除引用, 没有 doc 引用再删除 chunk (避免多个 doc 引用 1 个 chunk 的情况)
    // TODO 处理多个 doc 引用 1 个 chunk 增加时 路径 覆盖问题
    await this.#docChunkIndex.deleteDocuments(chunkHashs);
  };

  // 删除文档
  deleteDoc = async (path: string) => {
    path = slash(path);
    const doc = await this.#getDocByPathIfExist(path);

    if (!doc) {
      return;
    }

    // 删除内容
    await this.#deleteChunks(doc.hash, doc.chunkHashs);

    // 删除文档
    await this.#docIndex.deleteDocument(doc.hash);
  };

  // 搜索文档
  search = async (query: string) => {
    const result = await this.#docChunkIndex.search(query);
    const hits = result.hits;
    const outs = [];

    // 查询后校验结果中引用到的本地文档是否存在，不存在则删除知识库内文档
    // 自动删除文档, 防止停止运行时用户偷偷删除文档
    for (const hit of hits) {
      const docExists = await exists(hit.docPath);

      if (!docExists) {
        await this.deleteDoc(hit.docPath);
      } else {
        outs.push(hit);
      }
    }

    return outs;
  };
}
