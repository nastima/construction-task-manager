import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase';
import {
    getUserProfile,
    type UserProfile,
} from '@/features/auth/api/profile';

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
            const { data, error } = await supabase.auth.getSession();

            if (!isMounted) return;

            if (error) {
                console.error('Failed to restore session:', error);
            }

            setSession(data.session);
            setIsAuthLoading(false);
        };

        initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsAuthLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const userId = session?.user.id;

        if (!userId) {
            setProfile(null);
            setIsProfileLoading(false);
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
            } catch (error) {
                console.error('Failed to load user profile:', error);

                if (isMounted) {
                    setProfile(null);
                }
            } finally {
                if (isMounted) {
                    setIsProfileLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [session?.user.id]);

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
    };

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

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}