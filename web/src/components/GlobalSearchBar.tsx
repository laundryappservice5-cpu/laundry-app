import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  ClickAwayListener,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useDebounce } from '../hooks/useDebounce';
import { useLazyGlobalSearchQuery } from '../api/searchApi';
import { getId, getName } from '../utils/formatters';

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [trigger, { data, isFetching }] = useLazyGlobalSearchQuery();

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      trigger(debouncedQuery.trim());
    }
  }, [debouncedQuery, trigger]);

  const hasResults =
    data && (data.customers.length || data.pickups.length || data.orders.length || data.bills.length);

  function close() {
    setAnchorEl(null);
    setQuery('');
  }

  return (
    <Box sx={{ position: 'relative', width: { xs: '100%', sm: 360 } }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Search mobile, name, invoice, order…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setAnchorEl(e.currentTarget);
        }}
        onFocus={(e) => setAnchorEl(e.currentTarget)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />
      <Popper open={Boolean(anchorEl) && query.trim().length >= 2} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300, width: anchorEl?.clientWidth }}>
        <ClickAwayListener onClickAway={close}>
          <Paper sx={{ mt: 1, maxHeight: 400, overflowY: 'auto' }} elevation={6}>
            {isFetching && (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">Searching…</Typography>
              </Box>
            )}
            {!isFetching && !hasResults && (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">No results</Typography>
              </Box>
            )}
            {!isFetching && hasResults && (
              <List dense>
                {data!.customers.map((c) => (
                  <ListItemButton key={c._id} onClick={() => { navigate(`/customers/${c._id}`); close(); }}>
                    <ListItemText primary={`${c.name} — ${c.mobileNumber}`} secondary="Customer" />
                  </ListItemButton>
                ))}
                {data!.pickups.map((p) => (
                  <ListItemButton key={p._id} onClick={() => { navigate(`/pickups/${p._id}`); close(); }}>
                    <ListItemText primary={`Pickup — ${getName(p.customer)}`} secondary={`Status: ${p.status}`} />
                  </ListItemButton>
                ))}
                {data!.orders.map((o) => (
                  <ListItemButton key={o._id} onClick={() => { navigate(`/orders/${o._id}`); close(); }}>
                    <ListItemText primary={`Order — ${getName(o.customer)}`} secondary={`Status: ${o.currentStatus}`} />
                  </ListItemButton>
                ))}
                {data!.bills.map((b) => (
                  <ListItemButton key={b._id} onClick={() => { navigate(`/orders/${getId(b.order)}`); close(); }}>
                    <ListItemText primary={`Invoice ${b.invoiceNumber}`} secondary={`Amount: ${b.finalAmount}`} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
