// Pagina de chat com IA integrada ao contexto da estufa.

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';
import { sendChatMessage } from '../api/chatService.js';

// Mensagem inicial que aparece quando o usuario abre o chat.
const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  text: 'Ola! Sou o assistente da Plantelligence. Posso te ajudar com duvidas sobre cultivo de cogumelos, interpretar alertas das suas estufas ou sugerir ajustes nos parametros ambientais. Como posso ajudar?',
  timestamp: new Date().toISOString()
};

const generateMessageId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (_error) {
    return '--';
  }
};

// Normaliza texto markdown da IA para melhorar leitura na bolha do chat.
const normalizeAssistantText = (rawText) => {
  if (typeof rawText !== 'string') {
    return '';
  }

  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+(#{1,6}\s)/g, '\n\n$1')
    .replace(/\s+(\d+\.\s+\*\*)/g, '\n\n$1')
    .replace(/\s+(-\s+\*\*)/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const resolveSectionBadgeClass = (title = '') => {
  const normalized = title.toLowerCase();

  if (normalized.includes('diagn')) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  if (normalized.includes('agora') || normalized.includes('acao') || normalized.includes('fazer')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (normalized.includes('erro') || normalized.includes('evitar') || normalized.includes('prev')) {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }
  if (normalized.includes('grave') || normalized.includes('urg')) {
    return 'border-violet-200 bg-violet-50 text-violet-800';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
};

// Bolha de mensagem individual. Assistente fica a esquerda, usuario a direita.
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
        isUser
          ? 'bg-red-600 text-white'
          : 'border border-stone-200 bg-white text-slate-800'
      }`}>
        {!isUser ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-600">
            Assistente IA
          </p>
        ) : null}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        ) : (
          <div className="break-words text-slate-800 leading-relaxed [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:py-0.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ children }) => {
                  const title = String(children ?? '').replace(/^#+\s*/, '').trim();
                  return (
                    <h3 className={`mb-2 mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${resolveSectionBadgeClass(title)}`}>
                      {children}
                    </h3>
                  );
                }
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        )}
        <p className={`mt-1 text-[10px] ${isUser ? 'text-red-200' : 'text-slate-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

// Indicador animado de "assistente digitando..."
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
);

export const ChatAIPage = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Rola automaticamente para o final quando chega nova mensagem.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage = {
      id: generateMessageId(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMessage].map(({ role, text }) => ({
        role,
        content: text
      }));
      const result = await sendChatMessage({ messages: history });
      const reply = normalizeAssistantText(
        result?.response ?? 'Não consegui gerar resposta agora.'
      );

      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          text: reply,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (fetchError) {
      const detail = fetchError?.response?.data?.detail;
      const isIaUnavailable =
        typeof detail === 'string'
        && detail.toLowerCase().includes('assistente de ia indisponivel');

      setError(
        isIaUnavailable
          ? 'Assistente temporariamente indisponível. Tente novamente em alguns minutos.'
          : fetchError?.response?.data?.detail
          ?? fetchError?.response?.data?.message
          ?? 'Não foi possível obter uma resposta agora. Tente novamente em instantes.'
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <div className="rounded-[30px] bg-[#181415] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DashboardSideNav
            active="chat"
            footerText="Use o assistente para tirar duvidas de cultivo e receber orientacoes praticas."
          />

          <section className="flex flex-col overflow-hidden rounded-[26px] bg-[#f5f1eb] p-4 md:p-6 lg:h-[calc(100vh-160px)] lg:min-h-[640px] lg:max-h-[820px]">
            {/* Cabecalho */}
            <header className="mb-4 rounded-2xl border border-stone-300 bg-[#fcfaf7] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                  <i className="fa-solid fa-robot text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Assistente IA
                  </p>
                  <h1 className="mt-0.5 text-xl font-semibold text-slate-800">
                    Chat com IA
                  </h1>
                </div>
                <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Assistente online
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Tire duvidas sobre cultivo, interprete alertas e receba sugestoes de ajuste para suas estufas.
              </p>
            </header>

            {/* Area de mensagens — ocupa o espaco restante e rola internamente */}
            <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-y-auto pr-1 pb-2">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading ? <TypingIndicator /> : null}
              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {/* Campo de entrada */}
            <div className="mt-4 flex items-end gap-3 rounded-2xl border border-stone-300 bg-white p-3 shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 1000))}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre cultivo, alertas ou parametros ambientais..."
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border-0 bg-transparent px-1 py-1 text-sm text-slate-800 placeholder-slate-400 outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-40"
                aria-label="Enviar mensagem"
              >
                {loading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-sm" aria-hidden="true" />
                ) : (
                  <i className="fa-solid fa-paper-plane text-sm" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Pressione Enter para enviar · Shift+Enter para nova linha
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
