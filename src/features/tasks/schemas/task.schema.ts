import { z } from 'zod';

export const taskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Введите название задачи'),

    description: z
        .string(),

    object_id: z
        .string()
        .min(1, 'Выберите строительный объект'),

    executor_id: z
        .string()
        .min(1, 'Выберите исполнителя'),
});

export type TaskFormValues = z.infer<typeof taskSchema>;