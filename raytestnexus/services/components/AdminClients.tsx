import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type InviteResponse = {
  client_id: string;
  user_id: string;
  invite_sent: boolean;
  temp_password?: string;
};

const AdminClients: React.FC = () => {
  const { session, profile, refreshAccessibleClients } = useAuth();
  const [clientName, setClientName] = useState('');
  const [clientUserEmail, setClientUserEmail] = useState('');
  const [clientUserName, setClientUserName] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

  if (!profile || !['admin', 'user', 'sales', 'partner'].includes(profile.role)) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
        You do not have access to this page.
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    if (!functionsUrl) {
      setError('Missing VITE_SUPABASE_FUNCTIONS_URL');
      return;
    }

    if (!session?.access_token) {
      setError('Missing access token. Please sign in again.');
      return;
    }

    if (!clientName.trim() || !clientUserEmail.trim()) {
      setError('Client name and client email are required.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${functionsUrl}/invite-client-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_name: clientName.trim(),
          client_user_email: clientUserEmail.trim(),
          client_user_name: clientUserName.trim() || undefined,
          send_invite: sendInvite,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to invite client user.');
      }

      setResult(payload as InviteResponse);
      setClientName('');
      setClientUserEmail('');
      setClientUserName('');
      await refreshAccessibleClients();
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.temp_password) return;
    await navigator.clipboard.writeText(result.temp_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Invite Client User</h2>
      <p className="text-sm text-slate-500 mb-6">Create a client record and invite their login.</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Client name</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Acme Co"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Client user email</label>
          <input
            type="email"
            value={clientUserEmail}
            onChange={(e) => setClientUserEmail(e.target.value)}
            className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="client@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Client user name</label>
          <input
            value={clientUserName}
            onChange={(e) => setClientUserName(e.target.value)}
            className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Jane Client"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
          />
          Send invite email (otherwise create temp password)
        </label>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-slate-900 text-white py-3 rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-60"
        >
          {submitting ? 'Sending...' : 'Create client & invite'}
        </button>
      </form>

      {result && (
        <div className="mt-6 border-t border-slate-100 pt-6 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Client ID:</span> {result.client_id}
          </p>
          <p>
            <span className="font-semibold">User ID:</span> {result.user_id}
          </p>
          {result.temp_password && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Temp password:</span>
              <code className="px-2 py-1 bg-slate-100 rounded text-xs">{result.temp_password}</code>
              <button
                onClick={handleCopy}
                className="text-xs px-2 py-1 bg-slate-900 text-white rounded"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Invite sent: {result.invite_sent ? 'Yes' : 'No'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminClients;
