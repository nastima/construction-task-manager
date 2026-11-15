export type TaskStatus =
    | 'new'
    | 'in_progress'
    | 'on_review'
    | 'accepted'
    | 'revision';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    object_id: string;
    executor_id: string;
    author_id: string;
    status: TaskStatus;
    created_at: string;

    objects?: {
        id: string;
        name: string;
        address: string;
    } | null;
}

export interface CreateTaskData {
    title: string;
    description: string | null;
    object_id: string;
    executor_id: string;
    author_id: string;
}