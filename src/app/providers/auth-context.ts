import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/features/auth/api/profile';

export interface AuthContextValue {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);