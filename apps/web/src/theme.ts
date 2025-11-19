import { MantineColorsTuple, createTheme } from '@mantine/core';

const ocean: MantineColorsTuple = [
  '#ecf7ff',
  '#d3ecff',
  '#a6d6ff',
  '#78bfff',
  '#55adff',
  '#3d9fff',
  '#2a97ff',
  '#1581e6',
  '#006ecd',
  '#004d92'
];

const midnight: MantineColorsTuple = [
  '#f5f7fb',
  '#e4e9f1',
  '#c9d1e1',
  '#aab7d0',
  '#92a3c2',
  '#8296ba',
  '#7a90b6',
  '#6a7fa2',
  '#5f728f',
  '#4f5d74'
];

export const theme = createTheme({
  fontFamily: 'InterVariable, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  headings: {
    fontFamily: 'InterVariable, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '600'
  },
  defaultRadius: 'lg',
  primaryColor: 'ocean',
  luminanceThreshold: 0.35,
  colors: {
    ocean,
    midnight
  },
  spacing: {
    xxs: '0.35rem',
    xs: '0.75rem',
    lg: '1.75rem'
  },
  components: {
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true
      }
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm'
      }
    }
  }
});
