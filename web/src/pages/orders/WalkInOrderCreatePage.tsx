import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { useCreateWalkInOrderMutation } from '../../api/orderApi';
import { CustomerAutocomplete } from '../../components/CustomerAutocomplete';
import { CollectedItemsEditor } from '../../components/CollectedItemsEditor';
import { CustomerCreateDialog } from '../customers/CustomerCreateDialog';
import { DRIVER_LOGISTICS_ENABLED } from '../../utils/featureFlags';
import type { Customer } from '../../types';

export function WalkInOrderCreatePage() {
  const navigate = useNavigate();
  const [createWalkInOrder, { isLoading, error }] = useCreateWalkInOrderMutation();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [items, setItems] = useState<{ clothType?: string; service: string; quantity: number }[]>([]);
  const [isExpressDelivery, setIsExpressDelivery] = useState(false);
  const [isInStoreDelivery, setIsInStoreDelivery] = useState(true);
  const [notes, setNotes] = useState('');

  async function handleSubmit() {
    if (!customer || items.length === 0) return;
    const order = await createWalkInOrder({
      customer: customer._id,
      items,
      isExpressDelivery,
      isInStoreDelivery: DRIVER_LOGISTICS_ENABLED ? isInStoreDelivery : true,
      notes: notes || undefined,
    }).unwrap();
    navigate(`/orders/${order._id}`);
  }

  const canSubmit = Boolean(customer && items.length > 0);

  return (
    <Stack spacing={3} maxWidth={1000}>
      <Typography variant="h5" fontWeight={700}>
        New Walk-in Order
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use this when a customer drops off laundry in person at the store — no driver pickup needed.
      </Typography>

      {error && <Alert severity="error">Could not create the order. Check the form and try again.</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              1. Customer
            </Typography>
            <CustomerAutocomplete value={customer} onChange={setCustomer} />
            <Box>
              <Button size="small" onClick={() => setCreateCustomerOpen(true)}>
                + New customer instead
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              2. Delivery Options
            </Typography>
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={<Switch checked={isExpressDelivery} onChange={(e) => setIsExpressDelivery(e.target.checked)} />}
                label="Express Delivery"
              />
              {DRIVER_LOGISTICS_ENABLED && (
                <FormControlLabel
                  control={<Switch checked={isInStoreDelivery} onChange={(e) => setIsInStoreDelivery(e.target.checked)} />}
                  label="Customer will collect in-store"
                />
              )}
            </Stack>
            <TextField label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            3. Items Collected
          </Typography>
          <CollectedItemsEditor items={[]} onChange={setItems} hideSaveButton onSave={() => {}} />
        </CardContent>
      </Card>

      <Box>
        <Button variant="contained" size="large" disabled={!canSubmit || isLoading} onClick={handleSubmit}>
          {isLoading ? 'Creating…' : 'Create Order'}
        </Button>
      </Box>

      <CustomerCreateDialog open={createCustomerOpen} onClose={() => setCreateCustomerOpen(false)} onCreated={setCustomer} />
    </Stack>
  );
}
