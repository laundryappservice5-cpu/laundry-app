import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { useGetPublicAppInfoQuery } from '../api/settingsApi';
import { formatDateTime } from '../utils/formatters';

export function DownloadAppPage() {
  const { data, isLoading } = useGetPublicAppInfoQuery();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <>
              <Typography variant="h5" fontWeight={800} color="primary" gutterBottom>
                {data?.businessName ?? 'Laundry'} Driver App
              </Typography>
              {data?.latestApkVersion && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Version {data.latestApkVersion}
                </Typography>
              )}

              {data?.latestApkUrl ? (
                <Stack spacing={2} mt={3}>
                  <Button variant="contained" size="large" fullWidth href={data.latestApkUrl}>
                    Download App
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Last updated {formatDateTime(data.updatedAt)}
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                  No app download is available yet. Check back soon.
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
