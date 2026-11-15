import { LoginForm } from '@/features/auth/components/LoginForm';

import { Box, Card, Container, Typography } from '@mui/material';

export default function LoginPage() {

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                py: 4,
            }}
        >
            <Container maxWidth="xs">
                <Card
                    elevation={3}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 3,
                    }}
                >
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, mb: 1 }}
                        >
                            Construction Task Manager
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Система управления строительными задачами
                        </Typography>
                    </Box>
                    <LoginForm />
                </Card>
            </Container>
        </Box>
    );
}