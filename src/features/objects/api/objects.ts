import { supabase } from '@/shared/api/supabase';
import type { ConstructionObject } from '@/features/objects/types/object.types.ts';

export interface CreateObjectData {
    name: string;
    address: string;
}

export async function getObjects(): Promise<ConstructionObject[]> {
    const { data, error } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

export async function createObject(
    object: CreateObjectData,
): Promise<ConstructionObject> {
    const { data, error } = await supabase
        .from('objects')
        .insert(object)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function updateObject(
    id: string,
    object: CreateObjectData,
): Promise<ConstructionObject> {
    const { data, error } = await supabase
        .from('objects')
        .update(object)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteObject(id: string): Promise<void> {
    const { error } = await supabase
        .from('objects')
        .delete()
        .eq('id', id);

    if (error) throw error;
}