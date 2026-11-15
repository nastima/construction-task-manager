import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase';
import { getUserProfile, type UserProfile } from '@/features/auth/api/profile';
import {
    AuthContext,
    type AuthContextValue,
} from './auth-context';
import {signOut} from "@/features/auth/api/auth.ts";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            const { data } = await supabase.auth.getSession();

            if (!isMounted) return;

            setSession(data.session);
            setIsAuthLoading(false);
        };

        void initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsAuthLoading(false);

            if (!session?.user) {
                setProfile(null);
                setIsProfileLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const userId = session?.user.id;

        if (!userId) {
            return;
        }

        let isMounted = true;

        const loadProfile = async () => {
            setIsProfileLoading(true);

            try {
                const userProfile = await getUserProfile(userId);

                if (isMounted) {
                    setProfile(userProfile);
                }
            } catch  {
                if (isMounted) {
                    setProfile(null);
                }
            } finally {
                if (isMounted) {
                    setIsProfileLoading(false);
                }
            }
        };

        void loadProfile();

        return () => {
            isMounted = false;
        };
    }, [session?.user.id]);

    const value: AuthContextValue = {
        user: session?.user ?? null,
        session,
        profile,
        isLoading: isAuthLoading || isProfileLoading,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}