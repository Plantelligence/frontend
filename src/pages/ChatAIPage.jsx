/**
 * ChatAIPage — Assistente de IA especializado em cultivo de estufas.
 * Layout alinhado ao padrão visual das demais páginas do dashboard.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '../store/authStore.js';
import { refreshSession } from '../api/client.js';

// Retorna um token válido — refresca antes se estiver expirado (evita 401)
const getValidToken = async () => {
  const { tokens } = useAuthStore.getState();
  const token = tokens?.accessToken ?? tokens?.access_token ?? null;
  if (!token) {
    try { return await refreshSession(); } catch { return null; }
  }
  // Decodifica o JWT e verifica expiração com 60s de margem
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() > payload.exp * 1000 - 60000) {
      return await refreshSession();
    }
  } catch { /* token malformado — usa assim mesmo */ }
  return token;
};

// ── Constantes ─────────────────────────────────────────────────────────────────

const API_BASE = (() => {
  const raw = (import.meta.env?.VITE_APP_API_URL ?? '').trim();
  if (!raw) return '/api';
  // Garante HTTPS quando a página é servida por HTTPS (evita Mixed Content)
  const secured = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? raw.replace(/^http:\/\//i, 'https://')
    : raw;
  const cleaned = secured.replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
})();

const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  text: 'Olá! Sou o Assistente de Cultivo da plataforma **Plantelligence**. Posso te ajudar com dúvidas sobre cultivo de cogumelos, interpretar alertas das suas estufas ou sugerir ajustes nos parâmetros ambientais.\n\nComo posso ajudar?',
  timestamp: new Date().toISOString(),
  streaming: false,
};

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const fmtTime = (iso) => {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--'; }
};

// ── Bloco de código com botão copiar ──────────────────────────────────────────

const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const lang = (className || '').replace('language-', '') || 'código';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="group my-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{lang}</span>
        <button type="button" onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-medium text-stone-500 hover:text-stone-800 dark:text-stone-100">
          {copied ? <><i className="fa-solid fa-check text-emerald-600" /> Copiado!</> : <><i className="fa-regular fa-copy" /> Copiar</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-stone-800 dark:text-stone-100"><code>{code}</code></pre>
    </div>
  );
};

// ── Badge por seção ────────────────────────────────────────────────────────────

const sectionBadge = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('diagn'))                        return 'border-amber-300 bg-amber-50 text-amber-800';
  if (t.includes('agora') || t.includes('fazer')) return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  if (t.includes('erro') || t.includes('evitar')) return 'border-rose-300 bg-rose-50 text-rose-800';
  if (t.includes('grave') || t.includes('urg'))   return 'border-violet-300 bg-violet-50 text-violet-800';
  return 'border-stone-200 bg-stone-50 text-stone-700';
};

// ── Bolha de mensagem ──────────────────────────────────────────────────────────

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mr-2 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white">
          IA
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
        isUser
          ? 'bg-red-700 text-white rounded-br-md'
          : 'border border-stone-200 bg-white text-slate-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-bl-md'
      }`}>
        {!isUser && (
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-red-400">Assistente</p>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        ) : (
          <div className="break-words leading-relaxed
            [&_p]:my-1 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4
            [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-4
            [&_li]:my-0.5 dark:text-stone-100
            [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:text-[11px] [&_code]:text-red-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ children }) => (
                  <strong className="font-bold text-red-600 dark:text-red-500">{children}</strong>
                ),
                h3: ({ children }) => {
                  const title = String(children ?? '').replace(/^#+\s*/, '').trim();
                  return (
                    <h3 className={`mb-1.5 mt-2.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sectionBadge(title)}`}>
                      {children}
                    </h3>
                  );
                },
                code: ({ node, inline, className, children, ...props }) => {
                  if (inline) return <code className="rounded bg-stone-100 px-1 text-[11px] text-red-700" {...props}>{children}</code>;
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
              }}
            >
              {message.text || (message.streaming ? '' : '')}
            </ReactMarkdown>
            {message.streaming && !message.text && (
              <span className="text-xs text-stone-500 dark:text-stone-400 italic">Processando IA Plantelligence…</span>
            )}
            {message.streaming && message.text && (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-red-500 align-text-bottom" />
            )}
          </div>
        )}
        <p className={`mt-1 text-[9px] ${isUser ? 'text-red-200' : 'text-slate-400 dark:text-stone-500'}`}>{fmtTime(message.timestamp)}</p>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="mb-3 flex justify-start">
    <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white">IA</div>
    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800 px-4 py-2.5 shadow-sm">
      {[0,1,2].map(i => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-400" style={{ animationDelay: `${i*150}ms` }} />
      ))}
      <span className="text-xs text-stone-500 dark:text-stone-400 ml-1">Processando IA Plantelligence…</span>
    </div>
  </div>
);

// ── Componente principal ───────────────────────────────────────────────────────

export const ChatAIPage = () => {
  useAuthStore();

  const [messages, setMessages]   = useState([INITIAL_MESSAGE]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [streaming, setStreaming] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const containerRef   = useRef(null);
  const abortRef       = useRef(null);
  const isAtBottomRef  = useRef(true);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !isAtBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 60;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg = { id: uid(), role: 'user', text: trimmed, timestamp: new Date().toISOString() };
    const history = [...messages, userMsg].map(({ role, text }) => ({ role, content: text }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreaming(false);
    isAtBottomRef.current = true;

    const assistantId  = uid();
    const assistantMsg = { id: assistantId, role: 'assistant', text: '', timestamp: new Date().toISOString(), streaming: true };

    try {
      const token = await getValidToken();
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.detail || `Erro ${response.status}`);
      }

      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
      setStreaming(true);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';
      let   fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.chunk) {
              fullText += parsed.chunk;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: fullText } : m));
              scrollToBottom();
            }
            if (parsed.done) {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
              setStreaming(false);
            }
            if (parsed.error) {
              const errText = fullText || parsed.error || 'Assistente indisponível. Tente novamente.';
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: errText, streaming: false } : m));
              setStreaming(false);
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant', streaming: false,
        text: 'Não foi possível obter resposta do assistente. Verifique sua conexão e tente novamente.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      setStreaming(false);
      // Garante que o cursor some mesmo sem parsed.done
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([INITIAL_MESSAGE]);
    setLoading(false);
    setStreaming(false);
  };

  return (
    <div
      className="flex flex-col rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-[#0f0c0c]"
      style={{ height: 'calc(100vh - 7rem)', minHeight: '480px' }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-stone-200 px-5 py-3 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-500">
            <i className="fa-solid fa-robot text-sm" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">Assistente de Cultivo</p>
            <p className="text-[10px] text-stone-400">Especializado em fungicultura · Conformidade LGPD</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(loading || streaming) && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />Gerando...
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[10px] text-stone-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />Online
          </span>
          <button type="button" onClick={handleClear}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition hover:border-red-400 hover:text-red-700 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-500 dark:hover:text-red-400">
            <i className="fa-solid fa-trash-can mr-1" />Limpar
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {loading && !streaming && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Aviso */}
      <div className="flex-shrink-0 border-t border-stone-100 px-4 py-1.5 text-center dark:border-stone-800">
        <p className="text-[10px] text-stone-400">
          <i className="fa-solid fa-shield-halved mr-1" />
          Restrito a temas de cultivo. Não envie dados pessoais.
        </p>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800 md:px-6">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte sobre cultivo, alertas ou parâmetros da estufa..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400/30 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-xl bg-red-600 text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? <i className="fa-solid fa-circle-notch fa-spin text-sm" />
              : <i className="fa-solid fa-paper-plane text-sm" />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-stone-400">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
};
