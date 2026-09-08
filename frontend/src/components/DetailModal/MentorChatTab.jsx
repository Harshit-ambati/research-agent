import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, AlertCircle } from 'lucide-react';
import { chatMentor } from '../../utils/api';
import { renderMarkdown } from '../../utils/markdown';

const QUICK_PROMPTS = [
  { label: '🎤 Jury Questions', text: 'What are the top 3 questions the jury is likely to ask us?' },
  { label: '🔧 Bill of Materials', text: 'What is a realistic hardware bill of materials for a minimal prototype?' },
  { label: '📡 Offline Demo Strategy', text: 'How can we demonstrate offline capability during the 36h demo?' },
  { label: '⚠️ Technical Risks', text: 'What are the biggest technical risks and how do we mitigate them?' },
  { label: '📊 Datasets to Use', text: 'Suggest 3 unique datasets we can use for training or validation.' },
];

export default function MentorChatTab({ topic, llmStatus, onOpenLlmModal }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hi! I'm your SIH AI Mentor. Ask me anything about this problem statement — from technical architecture to jury preparation, bill of materials, and 36-hour sprint planning. Use the quick prompts above or type your own question below.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isTyping) return;

    // Add user message
    const updatedMessages = [
      ...messages,
      { role: 'user', content: textToSend },
    ];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Format history for backend
      const history = updatedMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1) // Exclude the message just added
        .map((m) => ({
          role: m.role,
          content: m.content,
          parts: [m.content],
        }));

      const res = await chatMentor(topic.id, textToSend, history);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply || 'No response from mentor.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Could not reach AI Mentor: ${err.message}. Please check your LLM configuration in the top bar.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      {/* Top Mentor Header */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-dark-900/60 border border-slate-800 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white">SIH AI Hackathon Mentor</h4>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${
              llmStatus?.active
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {llmStatus?.active ? 'Active' : 'Offline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            Ask about jury defense, BOM estimation, tech architecture, or edge strategies.
          </p>
        </div>
      </div>

      {!llmStatus?.active && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>LLM is offline. Open LLM Settings to select a model and enable mentor responses.</span>
          </div>
          {onOpenLlmModal && (
            <button
              type="button"
              onClick={onOpenLlmModal}
              className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 font-semibold shrink-0 cursor-pointer transition-colors"
            >
              Configure LLM
            </button>
          )}
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0">
        <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts:
        </span>
        {QUICK_PROMPTS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q.text)}
            className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 text-[11px] text-slate-300 hover:text-cyan-300 border border-slate-700/60 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-3 rounded-2xl bg-dark-950/60 border border-slate-800/80 mb-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'bg-dark-850/90 text-slate-200 border border-slate-800 shadow-sm'
              }`}
            >
              {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-dark-850/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask mentor about jury prep, architecture, edge fallbacks, hardware BOM..."
          className="flex-1 bg-dark-900 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-3 border border-slate-700/80 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
