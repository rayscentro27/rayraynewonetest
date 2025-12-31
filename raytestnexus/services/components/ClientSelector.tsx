import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ClientSelector: React.FC = () => {
  const { isInternalUser, accessibleClients, clientId, setClientId } = useAuth();

  if (!isInternalUser) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</label>
      <select
        value={clientId ?? ''}
        onChange={(e) => setClientId(e.target.value || null)}
        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
      >
        <option value="" disabled>
          Select client
        </option>
        {accessibleClients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientSelector;
