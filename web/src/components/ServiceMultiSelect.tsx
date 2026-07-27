import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select } from '@mui/material';
import { useListServicesQuery } from '../api/catalogApi';

interface ServiceMultiSelectProps {
  value: string[];
  onChange: (serviceIds: string[]) => void;
}

export function ServiceMultiSelect({ value, onChange }: ServiceMultiSelectProps) {
  const { data: services = [] } = useListServicesQuery();

  return (
    <FormControl fullWidth>
      <InputLabel id="services-label">Services Required</InputLabel>
      <Select
        labelId="services-label"
        multiple
        value={value}
        onChange={(e) => onChange(e.target.value as string[])}
        input={<OutlinedInput label="Services Required" />}
        renderValue={(selected) =>
          services
            .filter((s) => selected.includes(s._id))
            .map((s) => s.name)
            .join(', ') || 'None selected'
        }
      >
        {services.map((service) => (
          <MenuItem key={service._id} value={service._id}>
            <Checkbox checked={value.includes(service._id)} />
            <ListItemText primary={service.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
