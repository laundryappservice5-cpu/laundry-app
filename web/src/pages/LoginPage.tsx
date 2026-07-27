import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useLoginMutation } from '../api/authApi';
import { useAppDispatch } from '../app/hooks';
import { setSession } from '../features/auth/authSlice';

const loginSchema = z.object({
  mobileNumber: z.string().min(10, 'Enter a valid mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setErrorMessage(null);
    try {
      const result = await login(values).unwrap();
      if (result.user.role === 'DRIVER') {
        setErrorMessage('Drivers should use the mobile app, not the admin dashboard.');
        return;
      }
      dispatch(setSession(result));
      navigate('/', { replace: true });
    } catch {
      setErrorMessage('Invalid mobile number or password.');
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={800} color="primary" gutterBottom sx={{ letterSpacing: 0.3 }}>
            👑 The Royal Fresh Laundry
          </Typography>
          <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: 2 }}>
            Dubai
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3} mt={1}>
            Staff sign in — Root Admin &amp; Admin only
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <TextField
                label="Mobile Number"
                fullWidth
                autoFocus
                {...register('mobileNumber')}
                error={Boolean(errors.mobileNumber)}
                helperText={errors.mobileNumber?.message}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register('password')}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
