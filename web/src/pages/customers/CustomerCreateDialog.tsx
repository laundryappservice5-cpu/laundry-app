import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { useCreateCustomerMutation } from '../../api/customerApi';
import type { Customer } from '../../types';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobileNumber: z.string().min(10, 'Enter a valid mobile number'),
  alternateMobile: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  landmark: z.string().optional(),
  area: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
  initialMobileNumber?: string;
}

export function CustomerCreateDialog({ open, onClose, onCreated, initialMobileNumber }: CustomerCreateDialogProps) {
  const [createCustomer, { isLoading, error }] = useCreateCustomerMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    values: { name: '', mobileNumber: initialMobileNumber ?? '', alternateMobile: '', address: '', landmark: '', area: '', notes: '' },
  });

  async function onSubmit(values: CustomerForm) {
    const customer = await createCustomer({
      name: values.name,
      mobileNumber: values.mobileNumber,
      alternateMobile: values.alternateMobile || undefined,
      notes: values.notes || undefined,
      addresses: [{ address: values.address, landmark: values.landmark, area: values.area, isDefault: true }],
    }).unwrap();
    reset();
    onCreated(customer);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Customer</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            {error && (
              <Grid size={12}>
                <Alert severity="error">Could not create customer — check the mobile number isn't already in use.</Alert>
              </Grid>
            )}
            <Grid size={12}>
              <TextField label="Name" fullWidth {...register('name')} error={Boolean(errors.name)} helperText={errors.name?.message} />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Mobile Number"
                fullWidth
                {...register('mobileNumber')}
                error={Boolean(errors.mobileNumber)}
                helperText={errors.mobileNumber?.message}
              />
            </Grid>
            <Grid size={6}>
              <TextField label="Alternate Mobile" fullWidth {...register('alternateMobile')} />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Address"
                fullWidth
                {...register('address')}
                error={Boolean(errors.address)}
                helperText={errors.address?.message}
              />
            </Grid>
            <Grid size={6}>
              <TextField label="Landmark" fullWidth {...register('landmark')} />
            </Grid>
            <Grid size={6}>
              <TextField label="Area" fullWidth {...register('area')} />
            </Grid>
            <Grid size={12}>
              <TextField label="Notes" fullWidth multiline minRows={2} {...register('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create Customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
