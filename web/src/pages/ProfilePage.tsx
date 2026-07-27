import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useChangePasswordMutation, useCreateAdminMutation } from '../api/authApi';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../api/settingsApi';
import { useAppSelector } from '../app/hooks';
import { setCurrency, type Currency } from '../utils/currencyStore';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmNewPassword: z.string().min(6),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, { message: 'Passwords do not match', path: ['confirmNewPassword'] });

type PasswordForm = z.infer<typeof passwordSchema>;

const adminSchema = z
  .object({
    name: z.string().min(2),
    mobileNumber: z.string().min(10),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type AdminForm = z.infer<typeof adminSchema>;

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const [changePassword, { isLoading: isChangingPassword, error: passwordError, isSuccess: passwordSuccess }] =
    useChangePasswordMutation();
  const [createAdmin, { isLoading: isCreatingAdmin, error: adminError, isSuccess: adminSuccess }] = useCreateAdminMutation();

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const adminForm = useForm<AdminForm>({ resolver: zodResolver(adminSchema) });
  const [adminFormKey, setAdminFormKey] = useState(0);

  const { data: settings } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSavingSettings, isSuccess: settingsSaved }] = useUpdateSettingsMutation();

  const [pickupCharge, setPickupCharge] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [chargesInitialized, setChargesInitialized] = useState(false);

  if (settings && !chargesInitialized) {
    setPickupCharge(String(settings.homePickupCharge ?? 0));
    setDeliveryCharge(String(settings.homeDeliveryCharge ?? 0));
    setChargesInitialized(true);
  }

  async function handleCurrencyChange(currency: Currency) {
    await updateSettings({ currency }).unwrap();
    setCurrency(currency);
  }

  async function handleSaveCharges() {
    await updateSettings({
      homePickupCharge: Number(pickupCharge || 0),
      homeDeliveryCharge: Number(deliveryCharge || 0),
    }).unwrap();
  }

  async function onChangePassword(values: PasswordForm) {
    await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }).unwrap();
    passwordForm.reset();
  }

  async function onCreateAdmin(values: AdminForm) {
    await createAdmin(values).unwrap();
    adminForm.reset();
    setAdminFormKey((k) => k + 1);
  }

  return (
    <Stack spacing={3} maxWidth={560}>
      <Typography variant="h5" fontWeight={700}>
        Profile
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {user?.name} ({user?.role.replace('_', ' ')})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.mobileNumber}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Business Settings
          </Typography>
          {settingsSaved && <Alert severity="success" sx={{ mb: 2 }}>Settings updated.</Alert>}
          <TextField
            select
            fullWidth
            label="Currency"
            value={settings?.currency ?? 'INR'}
            disabled={isSavingSettings}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
            helperText="Applies to all bills, invoices, and reports across the app."
          >
            <MenuItem value="INR">₹ Indian Rupee (INR)</MenuItem>
            <MenuItem value="AED">AED — UAE Dirham</MenuItem>
          </TextField>

          <Stack direction="row" spacing={2} mt={2}>
            <TextField
              label="Home Pickup Charge"
              type="number"
              fullWidth
              value={pickupCharge}
              onChange={(e) => setPickupCharge(e.target.value)}
              helperText="Added to the bill when a driver collects the order."
            />
            <TextField
              label="Home Delivery Charge"
              type="number"
              fullWidth
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              helperText="Added to the bill when a driver delivers the order."
            />
          </Stack>
          <Button variant="outlined" sx={{ mt: 2 }} disabled={isSavingSettings} onClick={handleSaveCharges}>
            {isSavingSettings ? 'Saving…' : 'Save Charges'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Change Password
          </Typography>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
            <Stack spacing={2}>
              {passwordError && <Alert severity="error">Could not change password — check your current password.</Alert>}
              {passwordSuccess && <Alert severity="success">Password changed successfully.</Alert>}
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                {...passwordForm.register('currentPassword')}
                error={Boolean(passwordForm.formState.errors.currentPassword)}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                {...passwordForm.register('newPassword')}
                error={Boolean(passwordForm.formState.errors.newPassword)}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                {...passwordForm.register('confirmNewPassword')}
                error={Boolean(passwordForm.formState.errors.confirmNewPassword)}
                helperText={passwordForm.formState.errors.confirmNewPassword?.message}
              />
              <Button type="submit" variant="contained" disabled={isChangingPassword} sx={{ alignSelf: 'flex-start' }}>
                {isChangingPassword ? 'Updating…' : 'Update Password'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {user?.role === 'ROOT_ADMIN' && (
        <Card key={adminFormKey}>
          <CardContent>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Create Admin
            </Typography>
            <form onSubmit={adminForm.handleSubmit(onCreateAdmin)}>
              <Grid container spacing={2}>
                {adminError && (
                  <Grid size={12}>
                    <Alert severity="error">Could not create admin — mobile number may already be in use.</Alert>
                  </Grid>
                )}
                {adminSuccess && (
                  <Grid size={12}>
                    <Alert severity="success">Admin created successfully.</Alert>
                  </Grid>
                )}
                <Grid size={12}>
                  <TextField label="Name" fullWidth {...adminForm.register('name')} error={Boolean(adminForm.formState.errors.name)} />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Mobile Number"
                    fullWidth
                    {...adminForm.register('mobileNumber')}
                    error={Boolean(adminForm.formState.errors.mobileNumber)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    {...adminForm.register('password')}
                    error={Boolean(adminForm.formState.errors.password)}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    {...adminForm.register('confirmPassword')}
                    error={Boolean(adminForm.formState.errors.confirmPassword)}
                    helperText={adminForm.formState.errors.confirmPassword?.message}
                  />
                </Grid>
                <Grid size={12}>
                  <Button type="submit" variant="contained" disabled={isCreatingAdmin}>
                    {isCreatingAdmin ? 'Creating…' : 'Create Admin'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
