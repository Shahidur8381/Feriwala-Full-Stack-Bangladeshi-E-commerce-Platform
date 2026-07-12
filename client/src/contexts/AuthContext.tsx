import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Define a type that mimics Clerk's useUser structure to minimize refactoring
export type MockClerkUser = {
  id: string;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses?: { emailAddress: string }[];
  imageUrl?: string;
  publicMetadata?: any;
  phoneNumbers?: { phoneNumber: string }[];
  createdAt?: string;
};

export type AuthContextType = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: MockClerkUser | null;
  session: Session | null;
  supabaseToken: string | null;
};

const AuthContext = createContext<AuthContextType>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  session: null,
  supabaseToken: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<MockClerkUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        handleSessionUpdate(session);
        setIsLoaded(true);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        handleSessionUpdate(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionUpdate = (newSession: Session | null) => {
    setSession(newSession);
    setSupabaseToken(newSession?.access_token || null);
    
    if (newSession?.user) {
      const u = newSession.user;
      setUser({
        id: u.id,
        fullName: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
        primaryEmailAddress: u.email ? { emailAddress: u.email } : null,
        emailAddresses: u.email ? [{ emailAddress: u.email }] : [],
        imageUrl: u.user_metadata?.avatar_url || '',
        publicMetadata: u.user_metadata,
        createdAt: u.created_at,
      });
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoaded, isSignedIn: !!session, user, session, supabaseToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => useContext(AuthContext);
export const useAuth = () => useContext(AuthContext);
