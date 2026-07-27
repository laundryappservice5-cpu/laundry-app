import { Chip } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';

export function ExpressBadge({ label = 'Express' }: { label?: string }) {
  return <Chip size="small" icon={<BoltIcon />} label={label} color="warning" variant="filled" />;
}
