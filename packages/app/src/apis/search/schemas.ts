import { z } from "@hono/zod-openapi";

/**
 * 搜索结果
 */
export const SearchResultSchema = z
  .object({
    hash: z.string().length(16),
    paths: z.array(z.string()),
    content: z.string(),
  })
  .openapi("SearchResult");

/**
 * 搜索结果列表
 */
export const SearchResultsSchema = z
  .array(SearchResultSchema)
  .openapi("SearchResults");

/**
 * 搜索选项
 */
export const SearchOptionsSchema = z
  .object({
    offset: z.number().optional().describe("分页偏移量"),
    limit: z.number().optional().describe("每页限制数量"),
    attributesToHighlight: z
      .array(z.string())
      .optional()
      .describe("需要高亮的属性数组"),
    highlightPreTag: z.string().optional().describe("高亮前缀标签"),
    highlightPostTag: z.string().optional().describe("高亮后缀标签"),
    attributesToCrop: z
      .array(z.string())
      .optional()
      .describe("需要裁剪的属性数组"),
    cropLength: z.number().optional().describe("裁剪长度"),
    cropMarker: z.string().optional().describe("裁剪标记"),
    filter: z
      .union([z.string(), z.array(z.union([z.string(), z.array(z.string())]))])
      .optional()
      .describe("过滤条件"),
    sort: z.array(z.string()).optional().describe("排序条件数组"),
    facets: z.array(z.string()).optional().describe("分面搜索字段数组"),
    attributesToRetrieve: z
      .array(z.string())
      .optional()
      .describe("需要检索的属性数组"),
    showMatchesPosition: z.boolean().optional().describe("是否显示匹配位置"),
    matchingStrategy: z
      .enum(["all", "last", "frequency"])
      .optional()
      .describe("匹配策略"),
    hitsPerPage: z.number().optional().describe("每页命中数"),
    page: z.number().optional().describe("页码"),
    facetName: z.string().optional().describe("分面名称"),
    facetQuery: z.string().optional().describe("分面查询条件"),
    vector: z.array(z.number()).nullable().optional().describe("向量数组"),
    showRankingScore: z.boolean().optional().describe("是否显示排名分数"),
    showRankingScoreDetails: z
      .boolean()
      .optional()
      .describe("是否显示排名分数详情"),
    rankingScoreThreshold: z.number().optional().describe("排名分数阈值"),
    attributesToSearchOn: z
      .array(z.string())
      .nullable()
      .optional()
      .describe("搜索字段数组"),
    distinct: z.string().optional().describe("去重字段"),
    retrieveVectors: z.boolean().optional().describe("是否检索向量"),
    locales: z.array(z.string()).optional().describe("语言区域数组"),
  })
  .openapi("SearchOptions");

/**
 * 搜索参数
 */
export const SearchParamSchema = z
  .object({
    q: z.string(),
    opts: SearchOptionsSchema.optional(),
  })
  .openapi("SearchParam");
