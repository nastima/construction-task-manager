import { useEffect, useState } from 'react';
import AppHeader from '@/shared/ui/AppHeader/AppHeader';
import {
    getMyTasks,
    getRevisionComments,
    changeTaskStatus,
} from '@/features/tasks/api/tasks';
import type { Task } from '@/features/tasks/types/task.types';
import TaskHistory from '@/features/tasks/components/TaskHistory';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Stack,
    Typography,
} from '@mui/material';

const statusConfig: Record<
    Task['status'],
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

export default function ExecutorPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
    const [revisionComments, setRevisionComments] = useState<Record<string, string>>({});

    useEffect(() => {
        let isMounted = true;

        async function fetchTasks() {
            try {
                const data = await getMyTasks();
                const comments = await getRevisionComments(
                    data
                        .filter((task) => task.status === 'revision')
                        .map((task) => task.id),
                );

                if (isMounted) {
                    setTasks(data);
                    setRevisionComments(comments);
                }
            } catch {
                if (isMounted) {
                    setError('Не удалось загрузить задачи');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        void fetchTasks();

        return () => {
            isMounted = false;
        };
    }, []);

    async function handleStatusChange(
        taskId: string,
        newStatus: Task['status'],
    ) {
        try {
            setUpdatingTaskId(taskId);
            setError(null);
            const updatedTask = await changeTaskStatus(
                taskId,
                newStatus,
            );
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === taskId ? updatedTask : task,
                ),
            );

        } catch {
            setError('Не удалось изменить статус задачи');
        } finally {
            setUpdatingTaskId(null);
        }
    }

    return (
        <>
            <AppHeader />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={3}>

                    {/* Заголовок */}
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{ fontWeight: 700 }}
                        >
                            Панель исполнителя
                        </Typography>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            Управление назначенными задачами
                        </Typography>
                    </Box>

                    <Divider />

                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 600 }}
                    >
                        Мои задачи
                    </Typography>

                    {/* Загрузка */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Ошибка */}
                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}

                    {/* Пустой список */}
                    {!loading && tasks.length === 0 && !error && (
                        <Box
                            sx={{
                                py: 6,
                                textAlign: 'center',
                                bgcolor: 'background.paper',
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >

                            <Typography
                                variant="h6"
                                color="text.secondary"
                            >
                                У вас пока нет назначенных задач
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Новые задачи появятся здесь.
                            </Typography>
                        </Box>
                    )}

                    {/* Список задач */}
                    {!loading && tasks.map((task) => {
                        const status = statusConfig[task.status];

                        return (
                            <Card
                                key={task.id}
                                elevation={0}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 3,
                                    transition: '0.2s',
                                    '&:hover': {
                                        boxShadow: 3,
                                        borderColor: 'primary.light',
                                    },
                                }}
                            >

                                <CardContent sx={{ p: 3 }}>
                                    <Stack spacing={2}>
                                        {/* Заголовок */}
                                        <Stack
                                            direction="row"
                                            sx={{
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                            }}
                                        >

                                            <Typography
                                                variant="h6"
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {task.title}
                                            </Typography>

                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Stack>

                                        {/* Описание */}
                                        {task.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {task.description}
                                            </Typography>
                                        )}

                                        {/* Замечание менеджера */}
                                        {task.status === 'revision' && revisionComments[task.id] && (
                                            <Alert severity="warning">
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{ fontWeight: 600, mb: 0.5 }}
                                                >
                                                    Комментарий менеджера
                                                </Typography>

                                                <Typography variant="body2">
                                                    {revisionComments[task.id]}
                                                </Typography>
                                            </Alert>
                                        )}

                                        <Divider />

                                        {/* Информация об объекте */}
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Строительный объект
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500 }}
                                            >
                                                {task.objects?.name ?? 'Объект не найден'}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Дата создания
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500 }}
                                            >
                                                {new Date(task.created_at).toLocaleDateString('ru-RU')}
                                            </Typography>
                                        </Box>

                                        <Divider />

                                        {/* Изменение статуса */}
                                        <Stack
                                            direction="row"
                                            sx={{
                                                flexWrap: 'wrap',
                                                gap: 1,
                                            }}
                                        >

                                            {task.status === 'new' && (
                                                <Button
                                                    variant="contained"
                                                    disabled={updatingTaskId === task.id}
                                                    onClick={() =>
                                                        handleStatusChange(task.id, 'in_progress')
                                                    }
                                                >
                                                    Взять в работу
                                                </Button>
                                            )}

                                            {task.status === 'in_progress' && (
                                                <Button
                                                    variant="contained"
                                                    disabled={updatingTaskId === task.id}
                                                    onClick={() =>
                                                        handleStatusChange(task.id, 'on_review')
                                                    }
                                                >
                                                    Отправить на проверку
                                                </Button>
                                            )}

                                            {task.status === 'revision' && (
                                                <Button
                                                    variant="contained"
                                                    disabled={updatingTaskId === task.id}
                                                    onClick={() =>
                                                        handleStatusChange(task.id, 'in_progress')
                                                    }
                                                >
                                                    Взять на доработку
                                                </Button>
                                            )}

                                            {task.status === 'on_review' && (
                                                <Chip
                                                    label="Ожидает проверки менеджером"
                                                    color="secondary"
                                                    variant="outlined"
                                                />
                                            )}

                                            {task.status === 'accepted' && (
                                                <Chip
                                                    label="Задача завершена"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>

                                        {updatingTaskId === task.id && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Обновление статуса...
                                            </Typography>
                                        )}

                                        <Divider />

                                        {/* История */}
                                        <TaskHistory taskId={task.id} />
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            </Container>
        </>
    );
}