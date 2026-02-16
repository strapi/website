// @ts-expect-error vite is provided by Strapi internally

import { mergeConfig, type UserConfig } from "vite"

export default (config: UserConfig) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  } as UserConfig)
}
