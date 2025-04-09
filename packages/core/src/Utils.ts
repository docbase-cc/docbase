import { lowerCase } from "es-toolkit";
import { extname } from "path";
import os from "os";
import { Config, MeiliSearch } from "meilisearch";
import { ofetch } from "ofetch";

/** 从路径获取拓展名 */
export const getExtFromPath = (path: string) =>
  lowerCase(extname(path).replace(".", ""));

/** windows 标准化路径分隔符 */
export const slash = (path: string) => {
  const isExtendedLengthPath = path.startsWith("\\\\?\\");
  const isNotWindows = os.platform() !== "win32";

  if (isExtendedLengthPath || isNotWindows) {
    return path;
  }

  let result = "";
  for (let i = 0; i < path.length; i++) {
    if (path[i] === "\\") {
      result += "/";
      // 跳过连续的反斜杠
      while (i + 1 < path.length && path[i + 1] === "\\") {
        i++;
      }
    } else {
      result += path[i];
    }
  }
  return result;
};

export const createOpenaiEmbedder = ({
  url,
  apiKey,
  dimensions,
  model,
}: {
  url: string;
  apiKey: string;
  dimensions: string;
  model: string;
}) => ({
  source: "rest",
  url: url,
  apiKey: apiKey,
  dimensions: dimensions,
  request: {
    input: "{{text}}",
    model: model,
  },
  response: {
    data: [
      {
        embedding: "{{embedding}}",
      },
    ],
  },
});

/**
 * 确保 ContainsFilter 功能开启
 */
// https://www.meilisearch.com/docs/learn/filtering_and_sorting/filter_expression_reference#contains
export const ensureContainsFilterFeatureOn = async (client: MeiliSearch) => {
  const host = client.config.host;
  const key = client.config.apiKey;

  // 尝试并等待 meilisearch 启动
  console.debug("Trying to ensure ContainsFilter feature is on");
  const { containsFilter } = await ofetch(`${host}/experimental-features`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  if (!containsFilter) {
    console.debug("ContainsFilter feature is off, turning it on...");
    await ofetch(`${host}/experimental-features`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: { containsFilter: true },
    });
    console.debug("ContainsFilter feature turned on successfully");
  } else {
    console.debug("ContainsFilter feature is on");
  }
};

/** 创建 meilisearch 客户端 */
export const createMeilisearchClient = async (config: Config) => {
  const ml = new MeiliSearch(config);
  // await ensureContainsFilterFeatureOn(ml);
  return ml;
};
