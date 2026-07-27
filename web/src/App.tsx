import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeModeProvider } from './theme/ThemeModeProvider';
import { AuthBootstrap } from './features/auth/AuthBootstrap';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeModeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <AuthBootstrap>
            <AppRoutes />
          </AuthBootstrap>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeModeProvider>
  );
}
