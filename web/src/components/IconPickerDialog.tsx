import { Box, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { CLOTH_ICON_LIBRARY } from '../utils/clothTypeIcons';

interface IconPickerDialogProps {
  open: boolean;
  value?: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export function IconPickerDialog({ open, value, onSelect, onClose }: IconPickerDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Choose an Icon</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 1,
            pb: 1,
          }}
        >
          {CLOTH_ICON_LIBRARY.map((icon) => (
            <IconButton
              key={icon}
              onClick={() => {
                onSelect(icon);
                onClose();
              }}
              sx={{
                fontSize: 26,
                borderRadius: 2,
                border: '1px solid',
                borderColor: icon === value ? 'primary.main' : 'divider',
                bgcolor: icon === value ? 'action.selected' : 'transparent',
              }}
            >
              {icon}
            </IconButton>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
