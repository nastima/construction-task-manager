import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { changeTaskStatus } from '@/features/tasks/api/tasks';
import type { Task, TaskStatus } from '@/features/tasks/types/task.types';
import {
    Alert,
    Box,
    Button,
    Chip,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

type UserRole = 'manager' | 'executor';

interface TaskStatusActionsProps {
    task: Task;
    role: UserRole;
    onUpdated: (task: Task) => void;
}

const commentSchema = z.object({
    comment: z.string(),
});

type CommentFormValues = z.infer<typeof commentSchema>;

const statusConfig: Record<
    TaskStatus,
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

export default function TaskStatusActions({
    task,
    role,
    onUpdated,
}: TaskStatusActionsProps) {
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setError: setFormError,
        formState: { errors, isSubmitting },
    } = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            comment: '',
        },
    });

    const handleStatusChange = (newStatus: TaskStatus) => {
        setError(null);

        handleSubmit(async (values) => {
            if (newStatus === 'revision' && !values.comment.trim()) {
                setFormError('comment', {
                    type: 'manual',
                    message: 'Укажите причину отправки на доработку',
                });

                return;
            }

            try {
                const updatedTask = await changeTaskStatus(
                    task.id,
                    newStatus,
                    values.comment,
                );

                onUpdated(updatedTask);
                reset();
            } catch (error) {
                console.error('Failed to change task status:', error);
                setError('Не удалось изменить статус задачи');
            }
        })();
    };

    return (
        <Stack spacing={2}>

            {/* Текущий статус */}
            <Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                >
                    Текущий статус
                </Typography>

                <Chip
                    label={statusConfig[task.status].label}
                    color={statusConfig[task.status].color}
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            </Box>

            {/* Действия исполнителя */}
            {role === 'executor' && (
                <Stack
                    direction="row"
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                >

                    {task.status === 'new' && (
                        <Button
                            variant="contained"
                            disabled={isSubmitting}
                            onClick={() => handleStatusChange('in_progress')}
                        >
                            Взять в работу
                        </Button>
                    )}

                    {task.status === 'in_progress' && (
                        <Button
                            variant="contained"
                            disabled={isSubmitting}
                            onClick={() => handleStatusChange('on_review')}
                        >
                            Отправить на проверку
                        </Button>
                    )}

                    {task.status === 'revision' && (
                        <Button
                            variant="contained"
                            disabled={isSubmitting}
                            onClick={() => handleStatusChange('in_progress')}
                        >
                            Повторно взять в работу
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
            )}

            {/* Действия менеджера */}
            {role === 'manager' && task.status === 'on_review' && (
                <Stack spacing={2}>
                    <Button
                        variant="contained"
                        color="success"
                        disabled={isSubmitting}
                        onClick={() => handleStatusChange('accepted')}
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        Принять задачу
                    </Button>

                    <Box
                        sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                        }}
                    >

                        <Stack spacing={2}>
                            <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                            >
                                Отправить на доработку
                            </Typography>

                            <TextField
                                id={`comment-${task.id}`}
                                label="Причина доработки"
                                placeholder="Укажите, что необходимо исправить..."
                                multiline
                                minRows={3}
                                fullWidth
                                {...register('comment')}
                                error={!!errors.comment}
                                helperText={errors.comment?.message}
                            />

                            <Button
                                variant="outlined"
                                color="error"
                                disabled={isSubmitting}
                                onClick={() => handleStatusChange('revision')}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Отправить на доработку
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            )}

            {/* Загрузка */}
            {isSubmitting && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    Изменение статуса...
                </Typography>
            )}

            {/* Ошибка */}
            {error && (
                <Alert severity="error">
                    {error}
                </Alert>
            )}
        </Stack>
    );
}