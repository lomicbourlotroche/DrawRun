import type { Preview } from '@storybook/react';
import React from 'react';
import '../../app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'var(--bg)',
        },
        {
          name: 'dark',
          value: 'var(--neutral-900)',
        },
        {
          name: 'white',
          value: 'var(--surface)',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;



