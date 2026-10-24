import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { sendAiPrompt } from '../api/ai';
import { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

const SUGGESTIONS = {
  ADMIN: ['Give me a company-wide attendance and leave insight', 'Summarise payroll status this month', 'What is the leave policy?'],
  HR: ['Who is on leave this week?', 'How many pending leave approvals are there?', 'What is the late-arrival policy?'],
  EMPLOYEE: ['How many leaves do I have left?', 'What is my attendance this month?', 'I need sick leave tomorrow and the day after'],
};

export default function AiDrawer() {
  const { role, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'ai', text: `Hi${user?.firstName ? ` ${user.firstName}` : ''}! I'm the HCM Lite assistant. Ask about policies, your data, or describe a leave request in plain English.` },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || busy) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text: prompt }]);
    setBusy(true);
    try {
      const res = await sendAiPrompt(prompt);
      setMessages((m) => [...m, { from: 'ai', text: res.aiResponse ?? 'No response received.' }]);
    } catch (e) {
      setMessages((m) => [...m, { from: 'ai', text: `Sorry, I couldn't process that: ${errMsg(e)}`, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
          aria-label="Open AI assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {open && (
        <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">HCM AI Assistant</p>
                <p className="text-xs text-indigo-200">Answering as {role}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded p-1 hover:bg-indigo-500">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.from === 'user'
                      ? 'bg-indigo-600 text-white'
                      : m.error
                      ? 'border border-rose-200 bg-rose-50 text-rose-700'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-slate-400"><Spinner className="!h-4 !w-4" /> Thinking…</div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-4 py-2">
              {(SUGGESTIONS[role] || []).map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input className="input" placeholder="Ask anything…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn-primary !px-3" disabled={busy || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
