import React from 'react';
import DocumentVault from './DocumentVault';
import { useAuth } from '../../contexts/AuthContext';

const DocumentsPage: React.FC = () => {
  const { clientId, isInternalUser } = useAuth();

  if (!isInternalUser) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
        You do not have access to this page.
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
        Select a client to view documents.
      </div>
    );
  }

  return <DocumentVault readOnly={false} />;
};

export default DocumentsPage;
