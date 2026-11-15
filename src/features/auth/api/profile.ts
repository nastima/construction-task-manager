import { supabase } from '@/shared/api/supabase';

export type UserRole = 'manager' | 'executor';

export interface UserProfile {
    id: string;
    role: UserRole;
    created_at: string;
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role, created_at')
        .eq('id', userId)
        .single();

    if (error) {
        throw error;
    }

    return data as UserProfile;
}