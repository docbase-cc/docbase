import { DocBasePlugin } from "core/src"
import { name, version, description, exts, icon, displayName, author, homepage } from "./package.json"
import { PdfLoader } from '@llm-tools/embedjs-loader-pdf';
import { CsvLoader } from '@llm-tools/embedjs-loader-csv';
import { PptLoader, ExcelLoader, DocxLoader } from '@llm-tools/embedjs-loader-msoffice';
import { XmlLoader } from '@llm-tools/embedjs-loader-xml';
import { JsonLoader } from '@llm-tools/embedjs';
import { readJSON } from "fs-extra"
import { BaseLoader } from "@llm-tools/embedjs-interfaces";
import { basename } from "path";
import { single, transform } from "itertools-ts"
import { z } from "zod"

const paramsSchema = z.object({})

const plugin: DocBasePlugin<typeof paramsSchema> = {
    type: "DocLoader",
    exts: exts,
    name: name,
    version: version,
    displayName,
    author,
    description: description,
    homepage,
    icon,
    paramsSchema,
    init: async () => {
        return async (path) => {
            if (basename(path).startsWith("~$")) {
                return false as false;
            }

            let loader: BaseLoader | undefined = undefined

            if (path.endsWith(".pdf")) {
                loader = new PdfLoader({ filePathOrUrl: path });

            } else if (path.endsWith(".csv")) {
                loader = new CsvLoader({ filePathOrUrl: path });

            } else if (path.endsWith(".pptx")) {
                loader = new PptLoader({ filePathOrUrl: path });

            } else if (path.endsWith(".xlsx")) {
                loader = new ExcelLoader({ filePathOrUrl: path });

            } else if (path.endsWith(".docx")) {
                loader = new DocxLoader({ filePathOrUrl: path });

            } else if (path.endsWith(".xml")) {
                loader = new XmlLoader({ filePathOrUrl: path });

            } else if (path.endsWith(".json")) {
                const object = await readJSON(path)

                loader = new JsonLoader({ object: object });
            }

            if (loader) {
                const content = await transform.toArrayAsync(single.mapAsync(loader.getChunks(), async (chunk) => chunk.pageContent))

                return {
                    content: content.join(),
                }
            } else {
                return false
            }
        };
    },
}

export default plugin
