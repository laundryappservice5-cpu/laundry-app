import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'light' | 'dark';
export type ViewMode = 'table' | 'cards';

interface UiState {
  themeMode: ThemeMode;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
}

const initialState: UiState = {
  themeMode: (localStorage.getItem('themeMode') as ThemeMode) ?? 'light',
  sidebarCollapsed: false,
  viewMode: (localStorage.getItem('viewMode') as ViewMode) ?? 'table',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleThemeMode(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', state.themeMode);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
      localStorage.setItem('viewMode', action.payload);
    },
  },
});

export const { toggleThemeMode, toggleSidebar, setSidebarCollapsed, setViewMode } = uiSlice.actions;
export default uiSlice.reducer;
