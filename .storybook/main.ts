import type { StorybookConfig } from '@storybook/vue3-vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-themes',
  ],
  framework: '@storybook/vue3-vite',
  viteFinal(config) {
    // Ensure aliases are set
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string> || {}),
      '@': resolve(__dirname, '../src'),
      '@repo/shadcn-vue/lib/utils': resolve(__dirname, '../src/lib/utils.ts'),
    }

    // SCSS config
    config.css = config.css || {}
    config.css.preprocessorOptions = config.css.preprocessorOptions || {}
    config.css.preprocessorOptions.scss = {
      ...(config.css.preprocessorOptions.scss || {}),
      additionalData: `@use "@/styles/variables.scss" as *;`,
    }

    return config
  },
}

export default config
