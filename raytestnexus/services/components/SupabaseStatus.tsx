import React, { useEffect, useState } from "react";
import { Database, AlertTriangle, Ban } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

type Status = "idle" | "checking" | "connected" | "error" | "disabled";

const getLabel = (status: Status) => {
  switch (status) {
    case "connected": return "Supabase: Connected";
    case "checking": return "Supabase: Checking...";
    case "disabled": return "Supabase: Not configured";
    case "error": return "Supabase: Error";
    default: return "Supabase: Idle";
  }
};

export const SupabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let active = true;

    const check = async () => {
      if (!isSupabaseConfigured) {
        setStatus("disabled");
        setMessage("Add VITE_SUPABASE_URL/ANON_KEY");
        return;
      }
      setStatus("checking");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("connected");
        setMessage(data.session ? "Session available" : "No session (anon)");
      } catch (e: any) {
        if (!active) return;
        setStatus("error");
        setMessage(e?.message || "Unknown error");
      }
    };

    check();
    return () => { active = false; };
  }, []);

  const pillStyles: Record<Status, string> = {
    connected: "bg-emerald-50 text-emerald-700 border-emerald-100",
    checking: "bg-blue-50 text-blue-700 border-blue-100",
    disabled: "bg-slate-50 text-slate-600 border-slate-200",
    error: "bg-amber-50 text-amber-700 border-amber-200",
    idle: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const icon = () => {
    if (status === "error") return <AlertTriangle size={14} />;
    if (status === "disabled") return <Ban size={14} />;
    return <Database size={14} />;
  };

  return (
    <div className={`hidden lg:flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${pillStyles[status]}`}>
      {icon()}
      <span>{getLabel(status)}</span>
      {message && <span className="text-[10px] font-normal normal-case truncate max-w-[12rem]">• {message}</span>}
    </div>
  );
};

export default SupabaseStatus;
