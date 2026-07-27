import { useState } from 'react';
import { Badge, Box, IconButton, List, ListItemButton, ListItemText, Menu, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useListNotificationsQuery, useMarkNotificationReadMutation } from '../api/notificationApi';
import { formatDateTime } from '../utils/formatters';

export function NotificationsMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data: notifications = [] } = useListNotificationsQuery({ limit: 10 });
  const [markRead] = useMarkNotificationReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error" max={9}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { width: 360 } }}>
        {notifications.length === 0 && (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
          </Box>
        )}
        <List dense disablePadding>
          {notifications.map((n) => (
            <ListItemButton
              key={n._id}
              selected={!n.isRead}
              onClick={() => !n.isRead && markRead(n._id)}
            >
              <ListItemText
                primary={n.title}
                secondary={
                  <>
                    {n.body}
                    <Typography component="span" variant="caption" display="block" color="text.secondary">
                      {formatDateTime(n.createdAt)}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Menu>
    </>
  );
}
