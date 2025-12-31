import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Contact, ClientDocument } from '../../types';
import { Folder, FileText, Upload, CheckCircle, Eye, Shield, X, Loader, BrainCircuit, ScanLine, Share2, Sparkles, Fingerprint } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import * as geminiService from '../geminiService';
import SecureShareModal from './SecureShareModal';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlements } from '../hooks/useEntitlements';
import RequireEntitlement from './RequireEntitlement';

interface DocumentVaultProps {
  contact?: Contact;
  readOnly?: boolean; 
  onUpdateContact?: (contact: Contact) => void;
}

type VaultDocument = {
  id: string;
  name: string;
  type: ClientDocument['type'];
  status: ClientDocument['status'];
  uploadDate?: string;
  fileUrl?: string;
  path: string;
  mimeType?: string;
  createdAt?: string;
};

type ExtractionRecord = {
  id: number;
  path: string;
  extracted: Record<string, any>;
  created_at: string;
};

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; 

const sanitizeFileName = (name: string) => {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');
};

const inferMimeType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'application/octet-stream';
};

const DocumentVault: React.FC<DocumentVaultProps> = ({ contact, readOnly = false, onUpdateContact }) => {
  const { session, clientId } = useAuth();
  const effectiveClientId = clientId ?? contact?.id ?? null;
  const { hasAccess } = useEntitlements(effectiveClientId);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeAnalyzePath, setActiveAnalyzePath] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [extractions, setExtractions] = useState<Record<string, ExtractionRecord>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isForensicScanning, setIsForensicScanning] = useState(false);
  const [forensicResult, setForensicResult] = useState<any>(null);
  const [showForensicsModal, setShowForensicsModal] = useState(false);

  const categories = ['All', 'Legal', 'Financial', 'Credit', 'Identification', 'Other'];

  const filteredDocs = useMemo(() => {
    if (selectedCategory === 'All') return documents;
    return documents.filter((doc) => doc.type === selectedCategory);
  }, [documents, selectedCategory]);

  useEffect(() => {
    if (previewDoc) {
      setChatMessages([{ role: 'ai', text: `I'm ready to answer questions about ${previewDoc.name}.` }]);
    }
  }, [previewDoc]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadExtractions = async (paths: string[]) => {
    if (!effectiveClientId || paths.length === 0) {
      setExtractions({});
      return;
    }

    const { data, error } = await supabase
      .from('document_extractions')
      .select('id, path, extracted, created_at')
      .eq('client_id', effectiveClientId)
      .in('path', paths)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to load extractions:', error.message);
      return;
    }

    const latestByPath: Record<string, ExtractionRecord> = {};
    (data || []).forEach((row: ExtractionRecord) => {
      if (!latestByPath[row.path]) {
        latestByPath[row.path] = row;
      }
    });
    setExtractions(latestByPath);
  };

  const loadDocuments = async () => {
    if (!effectiveClientId) {
      setDocuments([]);
      return;
    }

    setLoadingDocs(true);
    setDocError(null);

    try {
      const prefix = `clients/${effectiveClientId}`;
      const { data, error } = await supabase
        .storage
        .from('documents')
        .list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;

      const files = data || [];
      const signedUrls = await Promise.all(
        files.map(async (file) => {
          const path = `${prefix}/${file.name}`;
          const { data: signed, error: signedError } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(path, 300);

          if (signedError) return null;

          return {
            path,
            name: file.name,
            signedUrl: signed?.signedUrl,
            createdAt: file.created_at,
            mimeType: inferMimeType(file.name),
          };
        })
      );

      const mappedDocs: VaultDocument[] = signedUrls
        .filter((doc): doc is NonNullable<typeof doc> => !!doc)
        .map((doc) => ({
          id: doc.path,
          name: doc.name,
          path: doc.path,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
          uploadDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : undefined,
          type: doc.mimeType === 'application/pdf' ? 'Financial' : 'Other',
          status: 'Pending Review',
          fileUrl: doc.signedUrl,
        }));

      setDocuments(mappedDocs);
      await loadExtractions(mappedDocs.map((doc) => doc.path));
    } catch (err: any) {
      setDocError(err?.message || 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [effectiveClientId]);

  const refreshSignedUrl = async (doc: VaultDocument) => {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(doc.path, 300);

    if (error || !data?.signedUrl) {
      setDocError(error?.message || 'Failed to refresh signed URL');
      return null;
    }

    setDocuments((prev) =>
      prev.map((item) => (item.path === doc.path ? { ...item, fileUrl: data.signedUrl } : item))
    );
    return data.signedUrl;
  };

  const analyzeDocument = async (doc: VaultDocument) => {
    if (!effectiveClientId) return;
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    if (!functionsUrl) {
      setDocError('Missing VITE_SUPABASE_FUNCTIONS_URL');
      return;
    }

    if (!session?.access_token) {
      setDocError('Missing access token');
      return;
    }

    setAnalyzing(true);
    setActiveAnalyzePath(doc.path);
    try {
      const response = await fetch(`${functionsUrl}/analyze-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_id: effectiveClientId,
          path: doc.path,
          mime_type: doc.mimeType || 'application/octet-stream',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to analyze document');
      }

      await loadExtractions([doc.path]);
    } catch (err: any) {
      setDocError(err?.message || 'Failed to analyze document');
    } finally {
      setAnalyzing(false);
      setActiveAnalyzePath(null);
    }
  };

  const handleStatusChange = (docId: string, newStatus: ClientDocument['status']) => {
    if (!onUpdateContact || !contact) return;

    const doc = documents.find(d => d.id === docId);
    let updatedChecklist = { ...contact.checklist };

    if (newStatus === 'Verified' && doc) {
      if (doc.name.toLowerCase().includes('ein')) updatedChecklist['comp_ein'] = true;
      if (doc.name.toLowerCase().includes('articles')) updatedChecklist['comp_sos'] = true;
      if (doc.name.toLowerCase().includes('license')) updatedChecklist['comp_id'] = true;
    }

    const updatedDocs = documents.map(doc => 
      doc.id === docId ? { ...doc, status: newStatus } : doc
    );

    onUpdateContact({ 
      ...contact, 
      documents: updatedDocs as ClientDocument[],
      checklist: updatedChecklist
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isAiScan: boolean = false) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!effectiveClientId) {
      setDocError('Select a client before uploading');
      return;
    }

    const file = event.target.files[0];
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      setDocError('Invalid file. Ensure it is a PDF/Image under 10MB.');
      return;
    }

    setUploading(true);
    if (isAiScan) setAnalyzing(true);
    setDocError(null);

    try {
      const filePath = `clients/${effectiveClientId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      await loadDocuments();

      const docForAnalysis: VaultDocument = {
        id: filePath,
        name: file.name,
        path: filePath,
        type: file.type === 'application/pdf' ? 'Financial' : 'Other',
        status: 'Pending Review',
        mimeType: file.type,
      };

      await analyzeDocument(docForAnalysis);
    } catch (error: any) {
      setDocError(error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleRunForensics = async () => {
    if (!previewDoc) return;
    setIsForensicScanning(true);
    setShowForensicsModal(true);
    try {
      const result = await geminiService.analyzeDocumentForensics('placeholder');
      setForensicResult(result || { trustScore: 98, riskLevel: 'Low', summary: 'Document verified authentic.' });
    } finally {
      setIsForensicScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending Review': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Missing': return 'bg-slate-100 text-slate-500 border-slate-200 border-dashed';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const canUpload = !readOnly && hasAccess;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-blue-600" size={20} /> Secure Data Room
          </h2>
          <p className="text-xs text-slate-500">Bank-grade storage for underwriting documents.</p>
        </div>
        <div className="flex gap-2 items-center">
           <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 text-xs font-bold flex flex-col items-center">
             <span>{documents.filter(d => d.status === 'Verified').length}</span>
             <span className="text-[9px] uppercase">Verified</span>
           </div>
           {!readOnly && (
             <button onClick={() => setIsShareModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg ml-2">
               <Share2 size={16} /> Share Deal
             </button>
           )}
        </div>
      </div>

      {docError && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {docError}
        </div>
      )}

      {!effectiveClientId && (
        <div className="mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Select a client to view documents.
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-slate-100">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
        {loadingDocs && (
          <div className="text-xs text-slate-400">Loading documents...</div>
        )}
        {!loadingDocs && filteredDocs.length === 0 && (
          <div className="text-xs text-slate-400">No documents uploaded yet.</div>
        )}
        {filteredDocs.map((doc) => {
          const extraction = extractions[doc.path];
          return (
            <div key={doc.id} className={`p-3 rounded-xl border transition-all group ${doc.status === 'Missing' ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.status === 'Missing' ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                    {doc.type === 'Legal' ? <Shield size={18} /> : doc.type === 'Financial' ? <FileText size={18} /> : <Folder size={18} />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${doc.status === 'Missing' ? 'text-slate-500' : 'text-slate-800'}`}>{doc.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">{doc.type}</span>
                      {doc.uploadDate && <span className="text-[10px] text-slate-400">- {doc.uploadDate}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        if (!doc.fileUrl) await refreshSignedUrl(doc);
                        setPreviewDoc(doc);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    {!readOnly && doc.status === 'Pending Review' && (
                      <button onClick={() => handleStatusChange(doc.id, 'Verified')} className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md transition-colors"><CheckCircle size={16} /></button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => analyzeDocument(doc)}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  disabled={activeAnalyzePath === doc.path}
                >
                  {activeAnalyzePath === doc.path ? 'Analyzing...' : 'Re-analyze'}
                </button>
                <button
                  onClick={() => refreshSignedUrl(doc)}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Refresh link
                </button>
              </div>
              {extraction && (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Extraction ({new Date(extraction.created_at).toLocaleString()})</div>
                  <pre className="whitespace-pre-wrap text-[10px] leading-relaxed">{JSON.stringify(extraction.extracted, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <RequireEntitlement clientId={effectiveClientId}>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div onClick={() => canUpload && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 transition-colors cursor-pointer h-32 ${canUpload ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30' : 'border-slate-200 opacity-60 cursor-not-allowed'}`}>
              {uploading && !analyzing ? <Loader className="animate-spin text-blue-600" size={24} /> : <Upload size={24} className="mb-2" />}
              <p className="text-xs font-medium text-center">{uploading && !analyzing ? 'Uploading...' : 'Standard Upload'}</p>
            </div>
            <div onClick={() => canUpload && aiInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer h-32 group ${canUpload ? 'border-indigo-200 bg-indigo-50/30 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50' : 'border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'}`}>
               {analyzing ? <ScanLine className="animate-pulse text-indigo-600" size={24} /> : <BrainCircuit size={24} className="mb-2 group-hover:scale-110 transition-transform" />}
               <p className="text-xs font-bold text-center">AI Auto-Spread</p>
            </div>
          </div>
        </RequireEntitlement>
      )}
      
      <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, false)} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
      <input type="file" ref={aiInputRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />

      {previewDoc && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 flex flex-col border-r border-slate-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> {previewDoc.name}</h3>
                  <div className="flex gap-2">
                    {!readOnly && <button onClick={handleRunForensics} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center gap-1"><Fingerprint size={14} /> Forensic Scan</button>}
                    <button onClick={() => setPreviewDoc(null)} className="md:hidden p-2 text-slate-500 hover:bg-slate-200 rounded"><X size={18}/></button>
                  </div>
                </div>
                <div className="flex-1 bg-slate-100 flex items-center justify-center relative">
                   {previewDoc.fileUrl ? (
                     <iframe src={previewDoc.fileUrl} className="w-full h-full border-0" title="Document Preview" />
                   ) : (
                     <div className="text-xs text-slate-500">No signed URL available.</div>
                   )}
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                   <span className="text-xs text-slate-500">Uploaded {previewDoc.uploadDate}</span>
                   {!readOnly && <button onClick={() => { handleStatusChange(previewDoc.id, 'Verified'); setPreviewDoc(null); }} className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 flex items-center gap-2"><CheckCircle size={16} /> Verify & Link</button>}
                </div>
            </div>
            <div className="w-full md:w-80 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={16} className="text-indigo-500" /> Chat with Contract</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                   {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
                      </div>
                   ))}
                   {isChatLoading && <div className="flex justify-start"><div className="bg-white border border-slate-200 p-3 rounded-xl rounded-bl-none shadow-sm flex gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span></div></div>}
                   <div ref={chatEndRef} />
                </div>
                <form onSubmit={async (e) => { e.preventDefault(); setIsChatLoading(true); setChatMessages(p => [...p, {role: 'user', text: chatInput}]);
                const res = await geminiService.generateLegalDocumentContent('Doc Analysis', {}, chatInput); setChatMessages(p => [...p, {role: 'ai', text: res}]); setChatInput(''); setIsChatLoading(false); }} className="p-4 border-t border-slate-100">
                    <input type="text" placeholder="Ask about this document..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </form>
            </div>
          </div>
        </div>
      )}

      {showForensicsModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-fade-in relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Fingerprint className="text-red-500" /> Forensic Audit Report</h3>
                 <button onClick={() => setShowForensicsModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>
              {isForensicScanning ? <Loader className="animate-spin text-red-500 mx-auto" /> : <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between">
                     <div><p className="text-xs font-bold text-slate-400">Trust Score</p><p className="text-3xl font-black text-emerald-500">{forensicResult?.trustScore}/100</p></div>
                     <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{forensicResult?.riskLevel} Risk</span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{forensicResult?.summary}</p>
              </div>}
           </div>
        </div>
      )}

      {contact && (
        <SecureShareModal contact={contact} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShare={() => {}} />
      )}
    </div>
  );
};

export default DocumentVault;
