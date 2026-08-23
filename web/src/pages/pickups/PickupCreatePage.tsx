import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { useGetCustomerByIdQuery } from '../../api/customerApi';
import { useListDriversQuery } from '../../api/driverApi';
import { useCreatePickupMutation } from '../../api/pickupApi';
import { CustomerAutocomplete } from '../../components/CustomerAutocomplete';
import { ServiceCardSelect } from '../../components/ServiceCardSelect';
import { CustomerCreateDialog } from '../customers/CustomerCreateDialog';
import type { Customer } from '../../types';

export function PickupCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const { data: preselectedData } = useGetCustomerByIdQuery(preselectedCustomerId!, { skip: !preselectedCustomerId });
  const { data: drivers = [] } = useListDriversQuery();
  const [createPickup, { isLoading, error }] = useCreatePickupMutation();

  const [customer, setCustomer] = useState<Customer | null>(preselectedData?.customer ?? null);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [addressId, setAddressId] = useState<string>('');
  const [manualAddress, setManualAddress] = useState({ address: '', landmark: '', area: '' });
  const [pickupDate, setPickupDate] = useState<Dayjs | null>(dayjs());
  const [pickupTime, setPickupTime] = useState<Dayjs | null>(dayjs().add(1, 'hour'));
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [driverId, setDriverId] = useState('');
  const [isExpressPickup, setIsExpressPickup] = useState(false);
  const [isExpressDelivery, setIsExpressDelivery] = useState(false);
  const [isInStoreDelivery, setIsInStoreDelivery] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (preselectedData && !customer) {
      setCustomer(preselectedData.customer);
    }
  }, [preselectedData, customer]);

  const selectedAddress =
    customer?.addresses.find((a) => a._id === addressId) ?? customer?.addresses.find((a) => a.isDefault) ?? customer?.addresses[0];

  async function handleSubmit() {
    if (!customer || !pickupDate || !pickupTime || serviceIds.length === 0) return;

    const addressPayload = selectedAddress
      ? { address: selectedAddress.address, landmark: selectedAddress.landmark, area: selectedAddress.area }
      : { address: manualAddress.address, landmark: manualAddress.landmark, area: manualAddress.area };

    const pickup = await createPickup({
      customer: customer._id,
      pickupAddress: addressPayload,
      pickupDate: pickupDate.format('YYYY-MM-DD'),
      pickupTime: pickupTime.format('hh:mm A'),
      servicesRequested: serviceIds,
      specialInstructions: specialInstructions || undefined,
      assignedDriver: driverId || undefined,
      isExpressPickup,
      isExpressDelivery,
      isInStoreDelivery,
      notes: notes || undefined,
    }).unwrap();

    navigate(`/pickups/${pickup._id}`);
  }

  const canSubmit = Boolean(customer && pickupDate && pickupTime && serviceIds.length > 0 && (selectedAddress || manualAddress.address));

  return (
    <Stack spacing={3} maxWidth={760}>
      <Typography variant="h5" fontWeight={700}>
        New Pickup
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use this when a customer calls in asking for a pickup.
      </Typography>

      {error && <Alert severity="error">Could not create the pickup. Check the form and try again.</Alert>}

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

            {customer && customer.addresses.length > 0 && (
              <TextField select label="Pickup Address" value={addressId || selectedAddress?._id || ''} onChange={(e) => setAddressId(e.target.value)}>
                {customer.addresses.map((addr) => (
                  <MenuItem key={addr._id} value={addr._id}>
                    {addr.address} {addr.area ? `— ${addr.area}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {customer && customer.addresses.length === 0 && (
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    label="Pickup Address"
                    fullWidth
                    value={manualAddress.address}
                    onChange={(e) => setManualAddress({ ...manualAddress, address: e.target.value })}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Landmark"
                    fullWidth
                    value={manualAddress.landmark}
                    onChange={(e) => setManualAddress({ ...manualAddress, landmark: e.target.value })}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Area"
                    fullWidth
                    value={manualAddress.area}
                    onChange={(e) => setManualAddress({ ...manualAddress, area: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              2. Schedule &amp; Services
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <DatePicker label="Pickup Date" value={pickupDate} onChange={setPickupDate} sx={{ width: '100%' }} />
              </Grid>
              <Grid size={6}>
                <TimePicker label="Pickup Time" value={pickupTime} onChange={setPickupTime} sx={{ width: '100%' }} />
              </Grid>
            </Grid>
            <ServiceCardSelect value={serviceIds} onChange={setServiceIds} />
            <TextField
              select
              label="Assign Driver (optional)"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {drivers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} {d.vehicleNumber ? `(${d.vehicleNumber})` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={<Switch checked={isExpressPickup} onChange={(e) => setIsExpressPickup(e.target.checked)} />}
                label="Express Pickup"
              />
              <FormControlLabel
                control={<Switch checked={isExpressDelivery} onChange={(e) => setIsExpressDelivery(e.target.checked)} />}
                label="Express Delivery"
              />
              <FormControlLabel
                control={<Switch checked={isInStoreDelivery} onChange={(e) => setIsInStoreDelivery(e.target.checked)} />}
                label="Customer will collect in-store"
              />
            </Stack>
            <TextField
              label="Special Instructions"
              multiline
              minRows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />
            <TextField label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Button variant="contained" size="large" disabled={!canSubmit || isLoading} onClick={handleSubmit}>
          {isLoading ? 'Creating…' : 'Create Pickup'}
        </Button>
      </Box>

      <CustomerCreateDialog open={createCustomerOpen} onClose={() => setCreateCustomerOpen(false)} onCreated={setCustomer} />
    </Stack>
  );
}
