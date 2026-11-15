import { useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Button,
    Chip,
    Avatar,
} from "@mui/material";
import ConstructionIcon from "@mui/icons-material/Construction";
import LogoutIcon from "@mui/icons-material/Logout";

import { useAuth } from "@/app/providers/AuthProvider";

export default function AppHeader() {
    const {user, profile, signOut} = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login', {replace: true});
        } catch (error) {
            console.error('Failed to sign out:', error);
        }
    };

    const roleLabel = profile?.role === 'manager'
        ? 'Менеджер'
        : 'Исполнитель';

    const emailInitial = user?.email?.[0]?.toUpperCase() ?? 'U';

    return (
        <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >

            <Toolbar
                sx={{
                    minHeight: '72px !important',
                    px: {xs: 2, md: 4},
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >

                    <ConstructionIcon
                        sx={{
                            fontSize: 32,
                            color: 'primary.main',
                        }}
                    />

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: {xs: 16, sm: 20},
                        }}
                    >
                        Construction Task Manager
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: {xs: 1, sm: 2},
                    }}
                >
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: 'primary.light',
                            color: 'primary.dark',
                            fontSize: 15,
                            fontWeight: 600,
                        }}
                    >
                        {emailInitial}
                    </Avatar>

                    <Box
                        sx={{
                            display: {xs: 'none', sm: 'flex'},
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 0.5,
                        }}
                    >

                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                            }}
                        >
                            {user?.email}
                        </Typography>

                        <Chip
                            label={roleLabel}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>

                    <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<LogoutIcon/>}
                        onClick={handleSignOut}
                        sx={{
                            ml: {xs: 0, sm: 1},
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': {
                                borderColor: 'primary.main',
                                color: 'primary.main',
                            },
                        }}
                    >
                        Выйти
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}