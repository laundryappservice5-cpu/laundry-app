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

  const selectedIsFlatFee = services.some((s) => value.includes(s._id) && s.flatPrice != null);

  function toggle(service: (typeof services)[number]) {
    const selected = value.includes(service._id);
    if (selected) {
      onChange(value.filter((id) => id !== service._id));
      return;
    }
    // A flat-fee service (e.g. House Cleaning) is a standalone service — selecting it
    // replaces any other selection, and it can't be combined with itemized services.
    onChange(service.flatPrice != null ? [service._id] : [...value, service._id]);
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Services Required
      </Typography>
      {selectedIsFlatFee && (
        <Typography variant="caption" color="warning.main">
          This is a direct, one-time service — it can't be combined with other services on the same pickup.
        </Typography>
      )}
      <Grid container spacing={1.5}>
        {services.map((service) => {
          const selected = value.includes(service._id);
          const disabled = selectedIsFlatFee && !selected;
          return (
            <Grid key={service._id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                variant="outlined"
                onClick={() => !disabled && toggle(service)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  opacity: disabled ? 0.4 : 1,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'action.selected' : 'background.paper',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  '&:hover': disabled ? undefined : { transform: 'translateY(-2px)', boxShadow: 3 },
                  '&:active': disabled ? undefined : { transform: 'scale(0.96)' },
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
                  {service.flatPrice != null && (
                    <Typography variant="caption" color="text.secondary">
                      Flat fee
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
