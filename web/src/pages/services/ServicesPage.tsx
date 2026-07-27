import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  useCreateClothTypeMutation,
  useListClothTypesQuery,
  useListServicesQuery,
  useSetClothTypePriceMutation,
} from '../../api/catalogApi';
import { getClothTypeIcon } from '../../utils/clothTypeIcons';
import { formatCurrency } from '../../utils/formatters';
import type { ClothType, Service } from '../../types';

export function ServicesPage() {
  const { data: services = [] } = useListServicesQuery();
  const { data: clothTypes = [], isLoading } = useListClothTypesQuery();
  const [setPrice, { isLoading: isSaving }] = useSetClothTypePriceMutation();
  const [createClothType, { isLoading: isCreating, error: createError }] = useCreateClothTypeMutation();

  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [editTarget, setEditTarget] = useState<ClothType | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  function openEdit(clothType: ClothType) {
    setEditTarget(clothType);
    const inputs: Record<string, string> = {};
    for (const svc of services) {
      inputs[svc._id] = String(clothType.prices?.[svc._id] ?? '');
    }
    setPriceInputs(inputs);
  }

  async function handleSavePrices() {
    if (!editTarget) return;
    const targetServices = activeTab === 'all' ? services : services.filter((s) => s._id === activeTab);
    for (const svc of targetServices) {
      await setPrice({ id: editTarget._id, service: svc._id, price: Number(priceInputs[svc._id] || 0) }).unwrap();
    }
    setEditTarget(null);
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    await createClothType({ name: newTypeName.trim() }).unwrap();
    setNewTypeName('');
    setAddTypeOpen(false);
  }

  const editServices: Service[] = activeTab === 'all' ? services : services.filter((s) => s._id === activeTab);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Services & Pricing
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddTypeOpen(true)}>
          Add Cloth Type
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Set a price for each item under each service. Tap an item card to edit its price{activeTab === 'all' ? 's' : ''}.
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All" value="all" />
        {services.map((svc) => (
          <Tab key={svc._id} label={svc.name} value={svc._id} />
        ))}
      </Tabs>

      <Grid container spacing={1.5}>
        {!isLoading &&
          clothTypes.map((ct) => (
            <Grid key={ct._id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                variant="outlined"
                onClick={() => openEdit(ct)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                <Typography fontSize={28}>{getClothTypeIcon(ct.name)}</Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {ct.name}
                </Typography>
                <Stack spacing={0.25} mt={0.5}>
                  {(activeTab === 'all' ? services : services.filter((s) => s._id === activeTab)).map((svc) => {
                    const price = ct.prices?.[svc._id];
                    return (
                      <Typography key={svc._id} variant="caption" color={price !== undefined ? 'primary.main' : 'text.disabled'}>
                        {activeTab === 'all' ? `${svc.name}: ` : ''}
                        {price !== undefined ? formatCurrency(price) : 'Not set'}
                      </Typography>
                    );
                  })}
                </Stack>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {getClothTypeIcon(editTarget?.name ?? '')} {editTarget?.name} — Pricing
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {editServices.map((svc) => (
              <TextField
                key={svc._id}
                type="number"
                label={`${svc.name} price`}
                fullWidth
                value={priceInputs[svc._id] ?? ''}
                onChange={(e) => setPriceInputs({ ...priceInputs, [svc._id]: e.target.value })}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSavePrices} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addTypeOpen} onClose={() => setAddTypeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Cloth Type</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {createError && <Box color="error.main" component={Typography} variant="body2">This cloth type already exists.</Box>}
            <TextField label="Name" fullWidth value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTypeOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateType} disabled={isCreating || !newTypeName.trim()}>
            {isCreating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
