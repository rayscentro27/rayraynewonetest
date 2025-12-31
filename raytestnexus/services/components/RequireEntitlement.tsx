import React from 'react';
import { useEntitlements } from '../hooks/useEntitlements';

interface RequireEntitlementProps {
  clientId: string | null;
  children: React.ReactNode;
}

const RequireEntitlement: React.FC<RequireEntitlementProps> = ({ clientId, children }) => {
  const { hasAccess, loading, error } = useEntitlements(clientId);

  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        Checking subscription status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
        {error}
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4 text-sm text-slate-600 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">Upgrade required</p>
          <p className="text-xs text-slate-500">This feature is available after purchase.</p>
        </div>
        <a
          href="/billing"
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider bg-slate-900 text-white rounded-md"
        >
          Upgrade
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireEntitlement;
