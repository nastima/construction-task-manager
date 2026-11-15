import { supabase } from '@/shared/api/supabase';
import type { Task, CreateTaskData } from '@/features/tasks/types/task.types';
import type { TaskStatus } from '@/features/tasks/types/task.types';

export type UpdateTaskData = Pick<
    CreateTaskData,
    'title' | 'description' | 'object_id' | 'executor_id'
>;

// Получение списка задач
export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*, objects(name)')
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

// Получение задач текущего исполнителя
export async function getMyTasks(): Promise<Task[]> {
    const {data: {user}, error: userError} =
        await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error('Пользователь не авторизован');
    }

    const {data, error} = await supabase
        .from('tasks')
        .select('*, objects(name)')
        .eq('executor_id', user.id)
        .order('created_at', {ascending: false});

    if (error) {
        throw error;
    }

    return data;
}

// Создание задачи
export async function createTask(
    task: CreateTaskData,
): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// Редактирование задачи
export async function updateTask(
    id: string,
    task: UpdateTaskData,
): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// Удаление задачи
export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
}

// Изменение статуса задачи
export async function changeTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    comment?: string,
): Promise<Task> {
    const { error } = await supabase.rpc('change_task_status', {
        p_task_id: taskId,
        p_new_status: newStatus,
        p_comment: comment?.trim() || null,
    });

    if (error) {
        throw error;
    }

    const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (fetchError) {
        throw fetchError;
    }

    return data;
}

// Получение последних комментариев менеджера по задачам на доработке

export async function getRevisionComments(
    taskIds: string[],
): Promise<Record<string, string>> {
    if (taskIds.length === 0) {
        return {};
    }

    const { data, error } = await supabase
        .from('task_status_history')
        .select('task_id, comment, created_at')
        .in('task_id', taskIds)
        .eq('new_status', 'revision')
        .not('comment', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    const comments: Record<string, string> = {};
    for (const item of data) {
        if (!comments[item.task_id] && item.comment) {
            comments[item.task_id] = item.comment;
        }
    }

    return comments;
}

// Тип записи истории изменений
export interface TaskStatusHistory {
    id: string;
    task_id: string;
    changed_by: string;
    old_status: TaskStatus | null;
    new_status: TaskStatus;
    comment: string | null;
    created_at: string;

    profiles: {
        role: string;
    } | null;
}

// Получение истории изменений задачи
export async function getTaskHistory(
    taskId: string,
): Promise<TaskStatusHistory[]> {
    const { data, error } = await supabase
        .from('task_status_history')
        .select(`
            *,
            profiles (
                role
            )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}