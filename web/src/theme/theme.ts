import { createTheme, type ThemeOptions } from '@mui/material/styles';

const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover': {
            transform: 'translateY(-3px)',
          },
          '& .MuiCardActionArea-focusHighlight': {
            transition: 'opacity 0.15s ease',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'transform 0.1s ease, box-shadow 0.15s ease',
          '&:active': { transform: 'scale(0.96)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.1s ease, background-color 0.15s ease',
          '&:active': { transform: 'scale(0.9)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, transition: 'transform 0.12s ease' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 2px rgba(0,0,0,0.06)' },
      },
    },
    MuiDialog: {
      defaultProps: {
        TransitionProps: { timeout: 220 },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { transition: 'background-color 0.12s ease' },
      },
    },
  },
};

// Royal Fresh Laundry brand palette — navy & gold, matching the crest.
export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'light',
    primary: { main: '#14213D', light: '#2E4270', dark: '#0A1224' },
    secondary: { main: '#C9A227', light: '#D9B54A', dark: '#A9860F' },
    background: { default: '#F7F5F0', paper: '#FFFFFF' },
    success: { main: '#2E9E5B' },
    warning: { main: '#D4AF37' },
    error: { main: '#E33E4C' },
  },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary: { main: '#D9B54A', light: '#E6CA6D', dark: '#C9A227' },
    secondary: { main: '#5C7FFA', light: '#8AA1FF', dark: '#2E4270' },
    background: { default: '#0B1526', paper: '#101B33' },
    success: { main: '#3FBE74' },
    warning: { main: '#E6CA6D' },
    error: { main: '#F2545B' },
  },
});
