import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, Card, CardContent, Divider, Grid, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useChangePasswordMutation, useCreateAdminMutation } from '../api/authApi';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../api/settingsApi';
import { useAppSelector } from '../app/hooks';
import { setCurrency, type Currency } from '../utils/currencyStore';

function PasswordField({
  label,
  registration,
  error,
  helperText,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: boolean;
  helperText?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      label={label}
      type={show ? 'text' : 'password'}
      fullWidth
      {...registration}
      error={error}
      helperText={helperText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShow((prev) => !prev)} edge="end" tabIndex={-1}>
                {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

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

  const [businessInfo, setBusinessInfo] = useState({ businessName: '', address: '', supportPhone: '', email: '', taxId: '' });
  const [businessInfoInitialized, setBusinessInfoInitialized] = useState(false);

  const [appInfo, setAppInfo] = useState({ latestApkUrl: '', latestApkVersion: '' });
  const [appInfoInitialized, setAppInfoInitialized] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (settings && !chargesInitialized) {
    setPickupCharge(String(settings.homePickupCharge ?? 0));
    setDeliveryCharge(String(settings.homeDeliveryCharge ?? 0));
    setChargesInitialized(true);
  }

  if (settings && !businessInfoInitialized) {
    setBusinessInfo({
      businessName: settings.businessName ?? '',
      address: settings.address ?? '',
      supportPhone: settings.supportPhone ?? '',
      email: settings.email ?? '',
      taxId: settings.taxId ?? '',
    });
    setBusinessInfoInitialized(true);
  }

  if (settings && !appInfoInitialized) {
    setAppInfo({
      latestApkUrl: settings.latestApkUrl ?? '',
      latestApkVersion: settings.latestApkVersion ?? '',
    });
    setAppInfoInitialized(true);
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

  async function handleSaveBusinessInfo() {
    await updateSettings(businessInfo).unwrap();
  }

  async function handleSaveAppInfo() {
    await updateSettings(appInfo).unwrap();
  }

  async function handleCopyDownloadLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/download-app`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
            Receipt Details
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Business Name"
              fullWidth
              value={businessInfo.businessName}
              onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              minRows={2}
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Contact Phone"
                fullWidth
                value={businessInfo.supportPhone}
                onChange={(e) => setBusinessInfo({ ...businessInfo, supportPhone: e.target.value })}
              />
              <TextField
                label="Email"
                fullWidth
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
              />
            </Stack>
            <TextField
              label="Tax ID (GSTIN / TRN)"
              fullWidth
              value={businessInfo.taxId}
              onChange={(e) => setBusinessInfo({ ...businessInfo, taxId: e.target.value })}
              helperText="Printed on receipts. Leave blank to hide."
            />
            <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={isSavingSettings} onClick={handleSaveBusinessInfo}>
              {isSavingSettings ? 'Saving…' : 'Save Receipt Details'}
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

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
            Mobile App
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Paste a link to the latest driver app build (e.g. a GitHub Release or Google Drive share link). Drivers can open the
            download page below to install it — no admin login needed.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="APK Download Link"
              fullWidth
              value={appInfo.latestApkUrl}
              onChange={(e) => setAppInfo({ ...appInfo, latestApkUrl: e.target.value })}
              placeholder="https://github.com/your-org/app/releases/latest/download/app.apk"
            />
            <TextField
              label="Version"
              fullWidth
              value={appInfo.latestApkVersion}
              onChange={(e) => setAppInfo({ ...appInfo, latestApkVersion: e.target.value })}
              placeholder="1.4.2"
            />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button variant="outlined" disabled={isSavingSettings} onClick={handleSaveAppInfo}>
                {isSavingSettings ? 'Saving…' : 'Save App Link'}
              </Button>
              <Button variant="text" onClick={handleCopyDownloadLink}>
                {linkCopied ? 'Copied!' : 'Copy Driver Download Link'}
              </Button>
            </Stack>
          </Stack>
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
              <PasswordField
                label="Current Password"
                registration={passwordForm.register('currentPassword')}
                error={Boolean(passwordForm.formState.errors.currentPassword)}
              />
              <PasswordField
                label="New Password"
                registration={passwordForm.register('newPassword')}
                error={Boolean(passwordForm.formState.errors.newPassword)}
              />
              <PasswordField
                label="Confirm New Password"
                registration={passwordForm.register('confirmNewPassword')}
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
                  <PasswordField
                    label="Password"
                    registration={adminForm.register('password')}
                    error={Boolean(adminForm.formState.errors.password)}
                  />
                </Grid>
                <Grid size={6}>
                  <PasswordField
                    label="Confirm Password"
                    registration={adminForm.register('confirmPassword')}
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
