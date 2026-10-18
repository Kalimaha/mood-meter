import type { StorybookConfig } from '@storybook/react-vite'
import type { PluginOption } from 'vite'

function isPwaPlugin(plugin: PluginOption): boolean {
  if (!plugin || typeof plugin !== 'object' || Array.isArray(plugin)) {
    return false
  }
  if ('name' in plugin && typeof plugin.name === 'string') {
    return plugin.name.startsWith('vite-plugin-pwa')
  }
  return false
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins = (viteConfig.plugins ?? [])
      .flat()
      .filter((plugin) => !isPwaPlugin(plugin))
    return viteConfig
  },
}

export default config
