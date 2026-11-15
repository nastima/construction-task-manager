import type { Task, TaskStatus } from '@/features/tasks/types/task.types';
import type { ConstructionObject } from '@/features/objects/types/object.types';
import TaskStatusActions from '@/features/tasks/components/TaskStatusActions';
import TaskHistory from '@/features/tasks/components/TaskHistory';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

interface TaskListProps {
    tasks: Task[];
    objects: ConstructionObject[];
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onStatusUpdated: (task: Task) => void;
    role: 'manager' | 'executor';
}

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

export default function TaskList({
    tasks,
    objects,
    onEdit,
    onDelete,
    onStatusUpdated,
    role,
}: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <Box
                sx={{
                    py: 6,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                }}
            >
                <Typography variant="h6" color="text.secondary">
                    Задачи пока не созданы
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    Здесь будут отображаться созданные задачи.
                </Typography>
            </Box>
        );
    }

    return (
        <Stack>
            {tasks.map((task) => {
                const constructionObject = objects.find(
                    (object) => object.id === task.object_id
                );
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
                                {/* Заголовок и статус */}
                                <Stack
                                    direction="row"
                                    sx={{
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                    }}
                                >

                                    <Box sx={{ flex: 1, minWidth: 180 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {task.title}
                                        </Typography>
                                    </Box>

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

                                <Divider />

                                {/* Информация о задаче */}
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={3}
                                    sx={{
                                        flexWrap: 'wrap',
                                    }}
                                >

                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Объект
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500 }}
                                        >
                                            {constructionObject?.name ?? 'Объект не найден'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Исполнитель
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500 }}
                                        >
                                            {task.executor_id.slice(0, 8)}
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
                                </Stack>

                                <Divider />

                                {/* Управление статусом */}
                                <Box>
                                    <TaskStatusActions
                                        task={task}
                                        role={role}
                                        onUpdated={onStatusUpdated}
                                    />
                                </Box>

                                {/* История изменений */}
                                <TaskHistory taskId={task.id} />

                                {/* Кнопки менеджера */}
                                {role === 'manager' && (
                                    <>
                                        <Divider />

                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => onEdit(task)}
                                            >
                                                Редактировать
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => onDelete(task.id)}
                                            >
                                                Удалить
                                            </Button>
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                );
            })}
        </Stack>
    )
}