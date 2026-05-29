import type { Preview } from '@storybook/react';
import '../src/styles/reset.css';
import '../src/styles/tokens.css';
import '../src/styles/themes/boxing-bout.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'arena',
      values: [
        { name: 'arena', value: '#0a0a0b' },
        { name: 'canvas', value: '#f0ead9' },
      ],
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    Story => {
      document.documentElement.setAttribute('data-theme', 'boxing-bout');
      return Story();
    },
  ],
};

export default preview;
