// Pagina de chat com IA integrada ao contexto da estufa.
// Esta tela usa respostas simuladas para manter o fluxo de conversa no frontend.

import React, { useEffect, useRef, useState } from 'react';
import { DashboardSideNav } from '../components/DashboardSideNav.jsx';

// Mensagem inicial que aparece quando o usuario abre o chat.
const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  text: 'Ola! Sou o assistente da Plantelligence. Posso te ajudar com duvidas sobre cultivo de cogumelos, interpretar alertas das suas estufas ou sugerir ajustes nos parametros ambientais. Como posso ajudar?',
  timestamp: new Date().toISOString()
};

// Respostas simuladas usadas pela experiencia local de conversa.
const STUB_RESPONSES = [
  'Entendido! Vou analisar os dados da estufa e responder em instantes. (Resposta simulada do modo local.)',
  'Boa pergunta sobre cogumelos! Recomendo verificar a umidade do substrato e garantir que esteja dentro da faixa ideal para esta especie.',
  'Para otimizar a producao, o intervalo de ventilacao e fundamental. Cogumelos produzem CO₂ e precisam de renovacao constante do ar.',
  'Veja os graficos de telemetria da estufa para identificar tendencias de temperatura nas ultimas horas. Variações acima de 3°C em 2 horas merecem atencao.',
  'Estou pronto para ajudar! Posso orientar ajustes de cultivo com base no contexto informado na conversa.',
];

// Retorna a resposta do fluxo de conversa em modo simulado.
const fetchAIResponse = async (userMessage, conversationHistory) => {
  // Simula latencia de rede e retorna uma mensagem do catalogo local.
  void userMessage;
  void conversationHistory;
  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600));
  const index = Math.floor(Math.random() * STUB_RESPONSES.length);
  return STUB_RESPONSES[index];
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
        <p className="leading-relaxed">{message.text}</p>
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Rola automaticamente para o final quando chega nova mensagem.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // Passa o historico atual (sem a mensagem inicial de boas-vindas)
      // para dar contexto ao modelo de IA.
      const history = messages.slice(1).map(({ role, text }) => ({ role, text }));
      const reply = await fetchAIResponse(trimmed, history);

      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'assistant',
          text: reply,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (_fetchError) {
      setError('Nao foi possivel conectar ao assistente. Verifique sua conexao e tente novamente.');
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
            footerText="Assistente IA em modo simulado para suporte no dashboard."
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
                <span className="ml-auto rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Modo simulado
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Tire duvidas sobre cultivo, interprete alertas e receba sugestoes de ajuste para suas estufas.
              </p>
            </header>

            {/* Area de mensagens — ocupa o espaco restante e rola internamente */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-2">
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
