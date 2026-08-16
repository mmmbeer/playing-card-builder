"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type NoticeTone = "error" | "info" | "success";
type Notice = { id: string; message: string; tone: NoticeTone };

export function useNotifications() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);
  const notify = useCallback((message: string, tone: NoticeTone = "info") => {
    const id = globalThis.crypto?.randomUUID?.() || `notice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotices((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 5000);
  }, [dismiss]);
  return { dismiss, notices, notify };
}

export function NotificationRegion({ notices, onDismiss }: { notices: Notice[]; onDismiss: (id: string) => void }) {
  return (
    <div className="notification-region" aria-live="polite" aria-atomic="false">
      {notices.map((notice) => {
        const Icon = notice.tone === "error" ? AlertCircle : notice.tone === "success" ? CheckCircle2 : Info;
        return (
          <div className={`notification ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"} key={notice.id}>
            <Icon />
            <span>{notice.message}</span>
            <button onClick={() => onDismiss(notice.id)} aria-label="Dismiss notification"><X /></button>
          </div>
        );
      })}
    </div>
  );
}
