import { useMemo, type ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAppSelector } from '../app/hooks';
import { lightTheme, darkTheme } from './theme';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const theme = useMemo(() => (themeMode === 'dark' ? darkTheme : lightTheme), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
