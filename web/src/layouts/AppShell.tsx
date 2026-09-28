import { useEffect, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOfferOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { toggleThemeMode } from '../features/ui/uiSlice';
import { GlobalSearchBar } from '../components/GlobalSearchBar';
import { NotificationsMenu } from '../components/NotificationsMenu';
import { FadeInOnMount } from '../components/FadeInOnMount';
import { useGetSettingsQuery } from '../api/settingsApi';
import { setCurrency } from '../utils/currencyStore';
import { DRIVER_LOGISTICS_ENABLED } from '../utils/featureFlags';
import { useAppVersion } from '../hooks/useAppVersion';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

const DRAWER_WIDTH = 248;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { label: 'Pickups', icon: <Inventory2Icon />, path: '/pickups', driverFeature: true },
  { label: 'Orders', icon: <LocalShippingIcon />, path: '/orders' },
  { label: 'Drivers', icon: <BadgeIcon />, path: '/drivers', driverFeature: true },
  { label: 'Services', icon: <LocalOfferIcon />, path: '/services' },
  { label: 'Payments', icon: <PaymentsOutlinedIcon />, path: '/payments', v2Feature: true },
  { label: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
];

export function AppShell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const { data: settings } = useGetSettingsQuery();
  const appVersion = useAppVersion();
  const navItems = NAV_ITEMS.filter(
    (item) => (!item.driverFeature || DRIVER_LOGISTICS_ENABLED) && (!item.v2Feature || appVersion === 2),
  );

  useEffect(() => {
    if (settings?.currency) setCurrency(settings.currency);
  }, [settings?.currency]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider' },
        }}
      >
        <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', py: 1.5 }}>
          <Typography variant="h6" fontWeight={800} color="primary" sx={{ letterSpacing: 0.3, lineHeight: 1.15 }}>
            👑 The Royal Fresh Laundry
          </Typography>
          <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: 2 }}>
            DUBAI
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 2 }}>
            <GlobalSearchBar />
            <Stack direction="row" spacing={1}>
              {DRIVER_LOGISTICS_ENABLED && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => navigate('/pickups/new')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  New Pickup
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<StorefrontOutlinedIcon />}
                onClick={() => navigate('/orders/walk-in')}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Walk-in Order
              </Button>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Toggle theme">
              <IconButton onClick={() => dispatch(toggleThemeMode())}>
                {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <NotificationsMenu />
            <Tooltip title={user?.name ?? ''}>
              <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
              <MenuItem
                onClick={() => {
                  setProfileAnchor(null);
                  navigate('/profile');
                }}
              >
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setProfileAnchor(null);
                  dispatch(logout());
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: 3 }}>
          <FadeInOnMount key={location.pathname}>
            <Outlet />
          </FadeInOnMount>
        </Box>
      </Box>
    </Box>
  );
}
