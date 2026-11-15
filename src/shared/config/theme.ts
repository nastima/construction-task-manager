import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2563EB',
            dark: '#1D4ED8',
            light: '#DBEAFE',
        },
        secondary: {
            main: '#64748B',
        },
        background: {
            default: '#F5F7FB',
            paper: '#FFFFFF',
        },
        success: {
            main: '#16A34A',
        },
        warning: {
            main: '#D97706',
        },
        error: {
            main: '#DC2626',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h1: {
            fontSize: '28px',
            fontWeight: 700,
        },
        h2: {
            fontSize: '22px',
            fontWeight: 600,
        },
        h3: {
            fontSize: '18px',
            fontWeight: 600,
        },
        body1: {
            fontSize: '14px',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    border: '1px solid #E2E8F0',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: 'small',
                fullWidth: true,
            },
        },
    },
});

export default theme;