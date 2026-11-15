import { z } from 'zod';

export const objectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Введите название объекта'),

    address: z
        .string()
        .trim()
        .min(1, 'Введите адрес объекта'),
});

export type ObjectFormValues = z.infer<typeof objectSchema>;