import { DocBasePlugin } from "core/src"
import { name, exts } from "./package.json"
import { PdfLoader } from '@llm-tools/embedjs-loader-pdf';
import { CsvLoader } from '@llm-tools/embedjs-loader-csv';
import { PptLoader, ExcelLoader, DocxLoader } from '@llm-tools/embedjs-loader-msoffice';
import { XmlLoader } from '@llm-tools/embedjs-loader-xml';
import { JsonLoader } from '@llm-tools/embedjs';
import { readJSON } from "fs-extra"
import { BaseLoader } from "@llm-tools/embedjs-interfaces";
import { basename } from "path";
import { AsyncStream, single, transform } from "itertools-ts"
import { z } from "zod"

export const schema = z.object({})

const plugin: DocBasePlugin<typeof schema> = {
    name: name,
    pluginType: "DocLoader",
    exts: exts,
    func: async ({ path, hash }) => {
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
            const texts = await transform.toArrayAsync(single.mapAsync(loader.getChunks(), async (chunk) => chunk.pageContent))

            return {
                hash: await hash(texts.join()),
                content: AsyncStream.of(texts)
            }
        } else {
            return false
        }
    }
}

export default plugin
