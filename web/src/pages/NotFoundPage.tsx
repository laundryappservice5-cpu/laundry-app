import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';

export function NotFoundPage() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2" fontWeight={800}>
          404
        </Typography>
        <Typography color="text.secondary">This page doesn't exist.</Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to Dashboard
        </Button>
      </Stack>
    </Box>
  );
}
