import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setViewMode, type ViewMode } from '../features/ui/uiSlice';

export function ViewToggle() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={viewMode}
      onChange={(_, next: ViewMode | null) => next && dispatch(setViewMode(next))}
    >
      <ToggleButton value="table">
        <Tooltip title="Table view">
          <ViewListIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="cards">
        <Tooltip title="Card view">
          <ViewModuleIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
