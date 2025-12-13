import type { GenerateOptions } from "eslint-doc-generator";

import { formatFile } from "oxfmt";

const config: GenerateOptions = {
  configEmoji: [["prohibit", "💥"]],
  postprocess: async (content, path) => {
    return await formatFile("markdown", path, content);
  },
};

export default config;
