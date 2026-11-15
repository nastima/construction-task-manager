import { useEffect, useState } from 'react';
import AppHeader from '@/shared/ui/AppHeader/AppHeader';
import ObjectForm from '@/features/objects/components/ObjectForm';
import { getObjects, deleteObject } from '@/features/objects/api/objects';
import type { ConstructionObject } from '@/features/objects/types/object.types';
import TaskForm from '@/features/tasks/components/TaskForm';
import TaskList from '@/features/tasks/components/TaskList';
import {
    getTasks,
    deleteTask,
} from '@/features/tasks/api/tasks';
import type { Task } from '@/features/tasks/types/task.types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Paper,
    Stack,
    Typography,
} from '@mui/material';

export default function ManagerPage() {
    const [objects, setObjects] = useState<ConstructionObject[]>([]);
    const [selectedObject, setSelectedObject] = useState<ConstructionObject | null>(null);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadObjects = async () => {
            try {
                const [objectsData, tasksData] = await Promise.all([
                    getObjects(),
                    getTasks(),
                ]);

                if (isMounted) {
                    setObjects(objectsData);
                    setTasks(tasksData);
                }
            } catch {
                if (isMounted) {
                    setError('Не удалось загрузить объекты и задачи');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadObjects();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleObjectCreated = (newObject: ConstructionObject) => {
        setObjects((prevObjects) => [newObject, ...prevObjects]);
    };

    const handleObjectUpdated = (updatedObject: ConstructionObject) => {
        setObjects((prevObjects) =>
            prevObjects.map((object) =>
                object.id === updatedObject.id ? updatedObject : object
            )
        );
        setSelectedObject(null);
    };

    const handleObjectDeleted = async (id: string) => {
        const confirmed = window.confirm(
            'Вы действительно хотите удалить этот объект?'
        );
        if (!confirmed) return;
        try {
            await deleteObject(id);
            setObjects((prevObjects) =>
                prevObjects.filter((object) => object.id !== id)
            );
            if (selectedObject?.id === id) {
                setSelectedObject(null);
            }
        } catch {
            alert('Не удалось удалить объект');
        }
    };

    const handleCancelEdit = () => {
        setSelectedObject(null);
    };

    const handleTaskCreated = (newTask: Task) => {
        setTasks((prevTasks) => [newTask, ...prevTasks]);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );
        setSelectedTask(null);
    };

    const handleTaskDeleted = async (id: string) => {
        const confirmed = window.confirm(
            'Вы действительно хотите удалить эту задачу?'
        );

        if (!confirmed) return;

        try {
            await deleteTask(id);
            setTasks((prevTasks) =>
                prevTasks.filter((task) => task.id !== id)
            );
        } catch {
            alert('Не удалось удалить задачу');
        }
    };

    const handleCancelTaskEdit = () => {
        setSelectedTask(null);
    };

    const handleTaskStatusUpdated = (updatedTask: Task) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );
    };

    return (
        <>
            <AppHeader />
            <Box
                component="main"
                sx={{
                    minHeight: 'calc(100vh - 64px)',
                    bgcolor: 'background.default',
                    py: { xs: 3, md: 5 },
                }}
            >

                <Container maxWidth="lg">

                    {/* Заголовок страницы */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                mb: 1,
                                fontWeight: 700,
                            }}
                        >
                            Панель менеджера
                        </Typography>

                        <Typography color="text.secondary">
                            Управление строительными объектами и задачами
                        </Typography>
                    </Box>

                    {/* Форма объекта */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            mb: 4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >

                        <Typography
                            variant="h6"
                            sx={{
                                mb: 2,
                                fontWeight: 600
                            }}>
                            {selectedObject
                                ? 'Редактирование объекта'
                                : 'Добавить строительный объект'}
                        </Typography>

                        <ObjectForm
                            key={selectedObject?.id ?? 'new'}
                            object={selectedObject}
                            onCreated={handleObjectCreated}
                            onUpdated={handleObjectUpdated}
                            onCancel={handleCancelEdit}
                        />
                    </Paper>

                    {/* Строительные объекты */}
                    <Box sx={{ mb: 5 }}>
                        <Typography
                            variant="h5"
                            component="h2"
                            sx={{
                                mb: 2,
                                fontWeight: 600,
                            }}
                        >
                            Строительные объекты
                        </Typography>

                        {isLoading && (
                            <Typography color="text.secondary">
                                Загрузка объектов...
                            </Typography>
                        )}

                        {error && (
                            <Alert severity="error">
                                {error}
                            </Alert>
                        )}

                        {!isLoading && !error && objects.length === 0 && (
                            <Alert severity="info">
                                Объекты пока не добавлены
                            </Alert>
                        )}

                        {!isLoading && !error && objects.length > 0 && (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        md: 'repeat(3, 1fr)',
                                    },
                                    gap: 2,
                                }}
                            >

                                {objects.map((object) => (
                                    <Card
                                        key={object.id}
                                        elevation={0}
                                        sx={{
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: '0.2s',
                                            '&:hover': {
                                                boxShadow: 3,
                                            },
                                        }}
                                    >

                                        <CardContent>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    mb: 1,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {object.name}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 2 }}
                                            >
                                                Адрес: {object.address}
                                            </Typography>

                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Создан:{' '}
                                                {new Date(
                                                    object.created_at
                                                ).toLocaleDateString('ru-RU')}
                                            </Typography>

                                            <Divider sx={{ my: 2 }} />

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                            >

                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() =>
                                                        setSelectedObject(object)
                                                    }
                                                >
                                                    Редактировать
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() =>
                                                        handleObjectDeleted(object.id)
                                                    }
                                                >
                                                    Удалить
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {/* Форма задачи */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            mb: 4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >

                        <Typography
                            variant="h6"
                            sx={{
                                mb: 2,
                                fontWeight: 600,
                            }}>
                            {selectedTask
                                ? 'Редактирование задачи'
                                : 'Создать задачу'}
                        </Typography>

                        <TaskForm
                            objects={objects}
                            task={selectedTask}
                            onCreated={handleTaskCreated}
                            onUpdated={handleTaskUpdated}
                            onCancel={handleCancelTaskEdit}
                        />
                    </Paper>

                    {/* Список задач */}
                    <Box>
                        <Typography
                            variant="h5"
                            component="h2"
                            sx={{
                                mb: 2,
                                fontWeight: 600,
                            }}
                        >
                            Список задач
                        </Typography>

                        {isLoading && (
                            <Typography color="text.secondary">
                                Загрузка задач...
                            </Typography>
                        )}

                        {!isLoading && !error && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2, md: 3 },
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >

                                <TaskList
                                    tasks={tasks}
                                    objects={objects}
                                    onEdit={setSelectedTask}
                                    onDelete={handleTaskDeleted}
                                    role="manager"
                                    onStatusUpdated={handleTaskStatusUpdated}
                                />
                            </Paper>
                        )}
                    </Box>
                </Container>
            </Box>
        </>
    );
}