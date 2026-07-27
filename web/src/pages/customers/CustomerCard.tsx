import { Avatar, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import type { Customer } from '../../types';

export function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const defaultAddress = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{customer.name[0]?.toUpperCase()}</Avatar>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {customer.name}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
            <PhoneIcon fontSize="small" />
            <Typography variant="body2">{customer.mobileNumber}</Typography>
          </Stack>
          {defaultAddress && (
            <Stack direction="row" spacing={1} alignItems="flex-start" color="text.secondary">
              <PlaceIcon fontSize="small" sx={{ mt: '2px' }} />
              <Typography variant="body2" noWrap>
                {defaultAddress.address}
                {defaultAddress.area ? `, ${defaultAddress.area}` : ''}
              </Typography>
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
