import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// Define the shape of the profile from the DB
export interface UserProfile {
  id: string;
  role: 'admin' | 'client' | 'partner' | 'sales' | 'user';
  name?: string;
  email?: string;
  settings?: {
    agencyName?: string;
    primaryColor?: string;
    [key: string]: any;
  };
}

export interface ClientSummary {
  id: string;
  name: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  debugLogin: (appUser: any) => Promise<void>;
  clientId: string | null;
  setClientId: (id: string | null) => void;
  accessibleClients: ClientSummary[];
  isInternalUser: boolean;
  refreshAccessibleClients: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  signOut: async () => {},
  loading: true,
  refreshProfile: async () => {},
  debugLogin: async () => {},
  clientId: null,
  setClientId: () => {},
  accessibleClients: [],
  isInternalUser: false,
  refreshAccessibleClients: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientIdState] = useState<string | null>(null);
  const [accessibleClients, setAccessibleClients] = useState<ClientSummary[]>([]);

  const isInternalUser = !!profile && ['admin', 'user', 'sales', 'partner'].includes(profile.role);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching profile (it may not exist yet):', error.message);
        return null;
      }
      return data as UserProfile;
    } catch (e) {
      console.error('Unexpected error fetching profile:', e);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      if (prof) setProfile(prof);
    }
  };

  const setClientId = (id: string | null) => {
    setClientIdState(id);
    if (id) {
      localStorage.setItem('activeClientId', id);
    } else {
      localStorage.removeItem('activeClientId');
    }
  };

  const fetchAccessibleClients = async (role: UserProfile['role'], userId: string) => {
    if (!isSupabaseConfigured) return [];

    if (role === 'admin') {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Error fetching clients:', error.message);
        return [];
      }
      return (data || []) as ClientSummary[];
    }

    if (['user', 'sales', 'partner'].includes(role)) {
      const { data, error } = await supabase
        .from('client_staff')
        .select('client_id')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error fetching client assignments:', error.message);
        return [];
      }

      const clientIds = (data || []).map((row: any) => row.client_id).filter(Boolean);
      if (clientIds.length === 0) return [];

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds)
        .order('name', { ascending: true });

      if (clientsError) {
        console.warn('Error fetching clients:', clientsError.message);
        return [];
      }

      return (clients || []) as ClientSummary[];
    }

    return [];
  };

  const refreshAccessibleClients = async () => {
    if (!user || !profile) return;
    const clients = await fetchAccessibleClients(profile.role, user.id);
    setAccessibleClients(clients);
    if (clients.length > 0 && !clients.some((client) => client.id === clientId)) {
      setClientIdState(clients[0].id);
    }
  };

  const debugLogin = async (appUser: any) => {
    // Construct a mock Supabase user object to satisfy types
    const mockSupabaseUser = {
      id: appUser.id,
      email: appUser.email,
      user_metadata: { name: appUser.name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated'
    } as User;

    const mockProfile: UserProfile = {
      id: appUser.id,
      role: appUser.role,
      name: appUser.name,
      email: appUser.email
    };

    setUser(mockSupabaseUser);
    setProfile(mockProfile);
    setSession({ 
      access_token: 'mock_token', 
      refresh_token: 'mock_refresh', 
      expires_in: 3600, 
      token_type: 'bearer', 
      user: mockSupabaseUser 
    });
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // If not configured, skip network call to avoid "Failed to fetch"
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const prof = await fetchProfile(session.user.id);
            setProfile(prof);
          }
        }
      } catch (error) {
        console.warn('Auth initialization warning (likely network error or invalid Supabase keys):', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
           // Fetch profile on login to ensure we have the latest role and settings
           const prof = await fetchProfile(session.user.id);
           setProfile(prof);
        } else {
           setProfile(null);
        }
        
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const resolveClientContext = async () => {
      if (!user || !profile || !isSupabaseConfigured) {
        setAccessibleClients([]);
        setClientIdState(null);
        return;
      }

      if (profile.role === 'client') {
        const { data, error } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching client user mapping:', error.message);
          setClientIdState(null);
          return;
        }

        setClientIdState(data?.client_id ?? null);
        setAccessibleClients([]);
        return;
      }

      if (['admin', 'user', 'sales', 'partner'].includes(profile.role)) {
        const clients = await fetchAccessibleClients(profile.role, user.id);
        setAccessibleClients(clients);
        const storedClientId = localStorage.getItem('activeClientId');
        const isStoredValid = storedClientId && clients.some((c) => c.id === storedClientId);
        if (isStoredValid) {
          setClientIdState(storedClientId);
        } else {
          setClientIdState(clients[0]?.id ?? null);
        }
        return;
      }

      setAccessibleClients([]);
      setClientIdState(null);
    };

    resolveClientContext();
  }, [user, profile]);

  const signOut = async () => {
    if (!isSupabaseConfigured) {
        setUser(null);
        setSession(null);
        setProfile(null);
        return;
    }
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        signOut,
        loading,
        refreshProfile,
        debugLogin,
        clientId,
        setClientId,
        accessibleClients,
        isInternalUser,
        refreshAccessibleClients,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
