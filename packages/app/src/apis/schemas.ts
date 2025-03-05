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
 * 搜索参数
 */
export const SearchParamSchema = z
  .object({
    q: z.string(),
  })
  .openapi("SearchParam");
