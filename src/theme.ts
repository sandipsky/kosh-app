import { Badge, createTheme } from '@mantine/core';

const INTER_STACK =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  fontFamily: INTER_STACK,
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  },
  headings: {
    fontWeight: '600',
    fontFamily: INTER_STACK,
  },
  components: {
    Card: { defaultProps: { withBorder: true, radius: 'md' } },
    Paper: { defaultProps: { radius: 'md' } },
    Button: { defaultProps: { radius: 'md' } },
    Badge: Badge.extend({
      styles: {
        label: { overflow: 'visible' },
        root: { overflow: 'visible' },
      },
    }),
  },
});
