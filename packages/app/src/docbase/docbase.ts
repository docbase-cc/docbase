import { DocBase, DocBaseOptions } from "core";

const createDocBase = async (opt: DocBaseOptions) => {
  const docBase = new DocBase(opt);

  // 启动 docBase
  await docBase.start();

  return docBase;
};

export { createDocBase };
