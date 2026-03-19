import type { Preview } from '@storybook/vue3-vite'
import { withThemeByClassName } from '@storybook/addon-themes'

// Import project styles (same as main.ts entry)
import '../tailwind.css'
import '../src/styles/index.scss'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    backgrounds: { disable: true },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
}

export default preview
