import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createObject, updateObject } from '@/features/objects/api/objects';
import {
    objectSchema,
    type ObjectFormValues,
} from '@/features/objects/schemas/object.schema';
import type { ConstructionObject } from '@/features/objects/types/object.types';
import {
    Alert,
    Box,
    Button,
    Stack,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

interface ObjectFormProps {
    object?: ConstructionObject | null;
    onCreated?: (object: ConstructionObject) => void;
    onUpdated?: (object: ConstructionObject) => void;
    onCancel?: () => void;
}

export default function ObjectForm({
    object,
    onCreated,
    onUpdated,
    onCancel,
}: ObjectFormProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ObjectFormValues>({
        resolver: zodResolver(objectSchema),
        defaultValues: {
            name: object?.name ?? '',
            address: object?.address ?? '',
        },
    });

    useEffect(() => {
        reset({
            name: object?.name ?? '',
            address: object?.address ?? '',
        });
        setServerError(null);
    }, [object, reset]);

    const onSubmit = async (values: ObjectFormValues) => {
        try {
            setServerError(null);
            if (object) {
                const updatedObject = await updateObject(object.id, values);
                onUpdated?.(updatedObject);
            } else {
                const newObject = await createObject(values);
                onCreated?.(newObject);
            }
            reset({
                name: '',
                address: '',
            });
        } catch (error) {
            console.error('Failed to save object:', error);
            setServerError('Не удалось сохранить объект. Попробуйте ещё раз.');
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
                <TextField
                    fullWidth
                    label="Название объекта"
                    placeholder={object ? '' : 'Например, ЖК Солнечный'}
                    {...register('name')}
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isSubmitting}
                    sx={{
                        '& input:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 100px #fff inset',
                            WebkitTextFillColor: '#1e293b',
                            caretColor: '#1e293b',
                            transition: 'background-color 5000s ease-in-out 0s',
                        },
                    }}
                />

                <TextField
                    fullWidth
                    label="Адрес объекта"
                    placeholder={object ? '' : 'Введите адрес'}
                    {...register('address')}
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}                    error={!!errors.address}
                    helperText={errors.address?.message}
                    disabled={isSubmitting}
                    sx={{
                        '& input:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 100px #fff inset',
                            WebkitTextFillColor: '#1e293b',
                            caretColor: '#1e293b',
                            transition: 'background-color 5000s ease-in-out 0s',
                        },
                    }}
                />

                {serverError && (
                    <Alert severity="error">
                        {serverError}
                    </Alert>
                )}

                <Stack direction="row" spacing={1.5}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={
                            object ? <SaveIcon /> : <AddIcon />
                        }
                    >
                        {isSubmitting
                            ? 'Сохранение...'
                            : object
                                ? 'Сохранить изменения'
                                : 'Добавить объект'}
                    </Button>

                    {object && (
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