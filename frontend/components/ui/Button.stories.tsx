import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Loader2, ArrowRight, Check } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Bouton principal de l\'application avec différentes variantes et tailles.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Style visuel du bouton',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du bouton',
    },
    isLoading: {
      control: 'boolean',
      description: 'Affiche un état de chargement',
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le bouton',
    },
    children: {
      control: 'text',
      description: 'Contenu du bouton',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Bouton Principal',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Bouton Secondaire',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Bouton Ghost',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Supprimer',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Petit Bouton',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Grand Bouton',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Chargement...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Désactivé',
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: 'Suivant',
    leftIcon: <ArrowRight className="w-4 h-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Confirmer',
    rightIcon: <Check className="w-4 h-4" />,
  },
};

export const FullExample: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Sauvegarder',
    leftIcon: <Check className="w-4 h-4" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemple complet avec icône et style principal.',
      },
    },
  },
};
