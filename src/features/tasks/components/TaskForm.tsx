import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/shared/api/supabase';
import { getObjects } from '@/features/objects/api/objects';
import {
    createTask,
    updateTask,
} from '@/features/tasks/api/tasks';
import {
    taskSchema,
    type TaskFormValues,
} from '@/features/tasks/schemas/task.schema';
import type { ConstructionObject } from '@/features/objects/types/object.types';
import type { Task } from '@/features/tasks/types/task.types';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

interface Executor {
    id: string;
}

interface TaskFormProps {
    onCreated: (task: Task) => void;
    task?: Task | null;
    onUpdated?: (task: Task) => void;
    onCancel?: () => void;
}

export default function TaskForm({
    onCreated,
    task = null,
    onUpdated,
    onCancel,
}: TaskFormProps) {
    const [objects, setObjects] = useState<ConstructionObject[]>([]);
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors, isSubmitting },
    } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            object_id: '',
            executor_id: '',
        },
    });

    // Загружаем строительные объекты и исполнителей
    useEffect(() => {
        const loadFormData = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);

                const [objectsData, executorsResponse] = await Promise.all([
                    getObjects(),
                    supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', 'executor'),
                ]);

                if (executorsResponse.error) {
                    setLoadError('Не удалось загрузить данные формы');
                    return;
                }

                setObjects(objectsData);
                setExecutors(executorsResponse.data ?? []);
            } catch  {
                setLoadError('Не удалось загрузить данные формы');
            } finally {
                setIsLoading(false);
            }
        };

        void loadFormData();
    }, []);

    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description ?? '',
                object_id: task.object_id,
                executor_id: task.executor_id,
            });
        } else {
            reset({
                title: '',
                description: '',
                object_id: '',
                executor_id: '',
            });
        }
    }, [task, reset]);

    // Создание задачи
    const onSubmit = async (values: TaskFormValues) => {
        try {
            const taskData = {
                title: values.title,
                description: values.description.trim() || null,
                object_id: values.object_id,
                executor_id: values.executor_id,
            };

            if (task) {
                const updatedTask = await updateTask(task.id, taskData);

                onUpdated?.(updatedTask);
            } else {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    setError('root.server', {
                        message: 'Не удалось определить пользователя',
                    });

                    return;
                }

                const newTask = await createTask({
                    ...taskData,
                    author_id: user.id,
                });

                onCreated(newTask);
            }

            reset();
        } catch {
            setError('root.server', {
                message: task
                    ? 'Не удалось обновить задачу'
                    : 'Не удалось создать задачу',
            });
        }
    };

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 2,
                }}
            >
                <CircularProgress size={22} />

                <Typography color="text.secondary">
                    Загрузка данных формы...
                </Typography>
            </Box>
        );
    }

    if (loadError) {
        return (
            <Alert severity="error">
                {loadError}
            </Alert>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
                {/* Название задачи */}
                <TextField
                    fullWidth
                    label="Название задачи"
                    placeholder="Например, Подготовить фундамент"
                    {...register('title')}
                    slotProps={{
                        inputLabel: { shrink: true },
                    }}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    disabled={isSubmitting}
                />

                {/* Описание */}
                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Описание задачи"
                    placeholder="Подробно опишите задачу..."
                    {...register('description')}
                    slotProps={{
                        inputLabel: { shrink: true },
                    }}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={isSubmitting}
                />

                {/* Выбор объекта */}
                <Controller
                    name="object_id"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            fullWidth
                            label="Строительный объект"
                            error={!!errors.object_id}
                            helperText={errors.object_id?.message}
                            disabled={isSubmitting}
                        >

                            <MenuItem value="">
                                Выберите объект
                            </MenuItem>

                            {objects.map((object) => (
                                <MenuItem
                                    key={object.id}
                                    value={object.id}
                                >
                                    {object.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                {/* Выбор исполнителя */}
                <Controller
                    name="executor_id"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            fullWidth
                            label="Исполнитель"
                            error={!!errors.executor_id}
                            helperText={errors.executor_id?.message}
                            disabled={isSubmitting}
                        >

                            <MenuItem value="">
                                Выберите исполнителя
                            </MenuItem>

                            {executors.map((executor) => (
                                <MenuItem
                                    key={executor.id}
                                    value={executor.id}
                                >
                                    Исполнитель ({executor.id.slice(0, 8)})
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                {/* Ошибка сервера */}
                {errors.root?.server && (
                    <Alert severity="error">
                        {errors.root.server.message}
                    </Alert>
                )}

                {/* Кнопки */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                >
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={
                            task ? <SaveIcon /> : <AddIcon />
                        }
                    >
                        {isSubmitting
                            ? 'Сохранение...'
                            : task
                                ? 'Сохранить изменения'
                                : 'Создать задачу'}
                    </Button>

                    {task && onCancel && (
                        <Button
                            type="button"
                            variant="outlined"
                            color="inherit"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            startIcon={<CancelIcon />}
                        >
                            Отмена
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
}