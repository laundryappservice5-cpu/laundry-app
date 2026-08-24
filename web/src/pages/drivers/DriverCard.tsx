import { Avatar, Card, CardContent, Chip, Stack, Switch, Typography } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined';
import type { PublicUser } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DriverCardProps {
  driver: PublicUser;
  onToggleActive: (isActive: boolean) => void;
  pendingAmount?: number;
  onOpenSettlement?: () => void;
}

export function DriverCard({ driver, onToggleActive, pendingAmount, onOpenSettlement }: DriverCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'secondary.main' }}>{driver.name[0]?.toUpperCase()}</Avatar>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {driver.name}
            </Typography>
          </Stack>
          <Switch checked={driver.isActive} onChange={(e) => onToggleActive(e.target.checked)} />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
          <PhoneIcon fontSize="small" />
          <Typography variant="body2">{driver.mobileNumber}</Typography>
        </Stack>
        {driver.vehicleNumber && (
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={pendingAmount ? 1 : 0}>
            <DirectionsCarIcon fontSize="small" />
            <Typography variant="body2">{driver.vehicleNumber}</Typography>
          </Stack>
        )}
        {Boolean(pendingAmount) && (
          <Chip
            size="small"
            color="error"
            variant="outlined"
            label={`${formatCurrency(pendingAmount!)} to collect`}
            onClick={onOpenSettlement}
            sx={{ mt: 0.5 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
