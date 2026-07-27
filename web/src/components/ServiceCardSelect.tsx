import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useListServicesQuery } from '../api/catalogApi';
import { getServiceIcon } from '../utils/serviceIcons';

interface ServiceCardSelectProps {
  value: string[];
  onChange: (serviceIds: string[]) => void;
}

export function ServiceCardSelect({ value, onChange }: ServiceCardSelectProps) {
  const { data: services = [] } = useListServicesQuery();

  function toggle(serviceId: string) {
    if (value.includes(serviceId)) {
      onChange(value.filter((id) => id !== serviceId));
    } else {
      onChange([...value, serviceId]);
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Services Required
      </Typography>
      <Grid container spacing={1.5}>
        {services.map((service) => {
          const selected = value.includes(service._id);
          return (
            <Grid key={service._id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                variant="outlined"
                onClick={() => toggle(service._id)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'action.selected' : 'background.paper',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                {selected && (
                  <CheckCircleIcon
                    color="primary"
                    fontSize="small"
                    sx={{ position: 'absolute', top: 6, right: 6 }}
                  />
                )}
                <Typography fontSize={28}>{getServiceIcon(service.name)}</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {service.name}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
