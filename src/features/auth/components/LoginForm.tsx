import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from '@/features/auth/api/auth';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '@/features/auth/api/profile';
import {
    loginSchema,
    type LoginFormValues,
} from '@/features/auth/schemas/login.schema';
import {
    Alert,
    Box,
    Button,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

export function LoginForm() {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            const data = await signIn(values.email, values.password);
            const profile = await getUserProfile(data.user.id);

            if (profile.role === 'manager') {
                navigate('/manager', { replace: true });
            } else if (profile.role === 'executor') {
                navigate('/executor', { replace: true });
            }
        } catch {
            setError('root.server', {
                message: 'Не удалось выполнить вход',
            });
        }
    };

    return (

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 600 }}
                >
                    Вход в систему
                </Typography>

                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    fullWidth
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                />

                <TextField
                    label="Пароль"
                    type="password"
                    autoComplete="current-password"
                    fullWidth
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                />

                {errors.root?.server && (
                    <Alert severity="error">
                        {errors.root.server.message}
                    </Alert>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSubmitting}
                    size="large"
                    sx={{
                        py: 1.3,
                        fontWeight: 600,
                    }}
                >
                    {isSubmitting ? 'Входим...' : 'Войти'}
                </Button>
            </Stack>
        </Box>
    );
}