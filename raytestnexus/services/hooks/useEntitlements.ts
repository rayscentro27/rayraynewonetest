import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export type EntitlementsState = {
  isSubscribed: boolean;
  hasOneTime: boolean;
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  subscriptions: { status: string }[];
  oneTimePayments: { status: string }[];
};

export const useEntitlements = (clientId: string | null): EntitlementsState => {
  const { isInternalUser, accessibleClients } = useAuth();
  const [subscriptions, setSubscriptions] = useState<{ status: string }[]>([]);
  const [oneTimePayments, setOneTimePayments] = useState<{ status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const internalHasAccess = useMemo(() => {
    if (!isInternalUser || !clientId) return false;
    return accessibleClients.some((client) => client.id === clientId);
  }, [accessibleClients, clientId, isInternalUser]);

  useEffect(() => {
    const fetchEntitlements = async () => {
      if (!clientId || !isSupabaseConfigured) {
        setSubscriptions([]);
        setOneTimePayments([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (internalHasAccess) {
        setSubscriptions([]);
        setOneTimePayments([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [{ data: subs, error: subsError }, { data: payments, error: paymentsError }] =
          await Promise.all([
            supabase
              .from('billing_subscriptions')
              .select('status')
              .eq('client_id', clientId),
            supabase
              .from('billing_one_time_payments')
              .select('status')
              .eq('client_id', clientId),
          ]);

        if (subsError) throw subsError;
        if (paymentsError) throw paymentsError;

        setSubscriptions((subs || []) as { status: string }[]);
        setOneTimePayments((payments || []) as { status: string }[]);
      } catch (err: any) {
        setError(err?.message || 'Failed to load entitlements');
      } finally {
        setLoading(false);
      }
    };

    fetchEntitlements();
  }, [clientId, internalHasAccess]);

  const isSubscribed = subscriptions.some((row) => ['active', 'trialing'].includes(row.status));
  const hasOneTime = oneTimePayments.some((row) => ['succeeded', 'paid'].includes(row.status));
  const hasAccess = internalHasAccess || isSubscribed || hasOneTime;

  return {
    isSubscribed,
    hasOneTime,
    hasAccess,
    loading,
    error,
    subscriptions,
    oneTimePayments,
  };
};
