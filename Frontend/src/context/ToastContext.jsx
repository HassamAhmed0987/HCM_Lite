import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const STYLES = {
  success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  error: { cls: 'border-rose-200 bg-rose-50 text-rose-800', Icon: XCircle },
  info: { cls: 'border-indigo-200 bg-indigo-50 text-indigo-800', Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => {
          const { cls, Icon } = STYLES[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${cls}`}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} aria-label="Dismiss">
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
