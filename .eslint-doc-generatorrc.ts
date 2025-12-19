import type { GenerateOptions } from "eslint-doc-generator";

import { format } from "oxfmt";

const config: GenerateOptions = {
  configEmoji: [["prohibit", "💥"]],
  postprocess: async (content, path) => {
    return (await format(path, content)).code;
  },
};

export default config;
