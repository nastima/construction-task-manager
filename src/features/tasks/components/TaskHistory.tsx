import { useEffect, useState } from 'react';
import {
    getTaskHistory,
    type TaskStatusHistory,
} from '@/features/tasks/api/tasks';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Typography,
} from '@mui/material';

interface TaskHistoryProps {
    taskId: string;
}

const statusConfig: Record<
    string,
    {
        label: string;
        color: 'info' | 'warning' | 'success' | 'error' | 'secondary';
    }
> = {
    new: {
        label: 'Новая',
        color: 'info',
    },
    in_progress: {
        label: 'В работе',
        color: 'warning',
    },
    on_review: {
        label: 'На проверке',
        color: 'secondary',
    },
    accepted: {
        label: 'Принята',
        color: 'success',
    },
    revision: {
        label: 'На доработке',
        color: 'error',
    },
};

export default function TaskHistory({ taskId }: TaskHistoryProps) {
    const [history, setHistory] = useState<TaskStatusHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        async function loadHistory() {
            try {
                setLoading(true);
                setError(null);

                const data = await getTaskHistory(taskId);

                setHistory(data);
            } catch {
                setError('Не удалось загрузить историю изменений');
            } finally {
                setLoading(false);
            }
        }

        void loadHistory();
    }, [taskId, isOpen]);

    return (
        <Box>
            <Button
                variant="text"
                size="small"
                onClick={() => setIsOpen((prev) => !prev)}
                sx={{ px: 0 }}
            >
                {isOpen ? 'Скрыть историю' : 'История изменений'}
            </Button>

            {isOpen && (
                <Box
                    sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 2,
                    }}
                >

                    {/* Загрузка */}
                    {loading && (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                py: 2,
                            }}
                        >
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {/* Ошибка */}
                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}

                    {/* Пустая история */}
                    {!loading && !error && history.length === 0 && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            История изменений пока пуста.
                        </Typography>
                    )}

                    {/* Список изменений */}
                    {!loading && !error && history.length > 0 && (
                        <Stack spacing={2}>
                            {history.map((item, index) => (
                                <Box key={item.id}>
                                    <Stack spacing={1}>
                                        {/* Дата */}
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {new Date(item.created_at).toLocaleString('ru-RU')}
                                        </Typography>

                                        {/* Изменение статуса */}
                                        <Stack
                                            direction="row"
                                            sx={{
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                            }}
                                        >

                                            {item.old_status ? (
                                                <>
                                                    <Chip
                                                        label={statusConfig[item.old_status]?.label ?? item.old_status}
                                                        color={statusConfig[item.old_status]?.color ?? 'default'}
                                                        size="small"
                                                    />

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        →
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    Создание задачи:
                                                </Typography>
                                            )}

                                            <Chip
                                                label={statusConfig[item.new_status]?.label ?? item.new_status}
                                                color={statusConfig[item.new_status]?.color ?? 'default'}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Stack>

                                        {/* Комментарий */}
                                        {item.comment && (
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    bgcolor: 'background.paper',
                                                    borderRadius: 1,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Комментарий
                                                </Typography>
                                                <Typography variant="body2">
                                                    {item.comment}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Автор */}
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Автор: {item.profiles?.role === 'manager'
                                            ? 'Менеджер'
                                            : 'Исполнитель'}
                                        </Typography>
                                    </Stack>

                                    {index < history.length - 1 && (
                                        <Divider sx={{ mt: 2 }} />
                                    )}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}
        </Box>
    );
}