import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bot, Sparkles, Zap, Brain, Server, Check, AlertCircle, Loader2, KeyRound, ExternalLink, RefreshCw } from 'lucide-react';
import { configureLLM, testLLM, fetchLLMStatus } from '../utils/api';

const DEFAULT_PROVIDERS = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    models: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
    default_model: 'gemini-2.5-flash',
    needs_key: true,
    key_url: 'https://aistudio.google.com/app/apikey',
    key_hint: 'Get free key at Google AI Studio',
    description: 'Fast multimodal model with reasoning (Recommended for hackathons)',
  },
  {
    id: 'groq',
    label: 'Groq (Fast LLaMA / Mixtral)',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    default_model: 'llama-3.3-70b-versatile',
    needs_key: true,
    key_url: 'https://console.groq.com/keys',
    key_hint: 'Get key at Groq Console',
    description: 'Ultra-fast inference powered by Groq LPUs',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    default_model: 'gpt-4o-mini',
    needs_key: true,
    key_url: 'https://platform.openai.com/api-keys',
    key_hint: 'Get key at OpenAI Platform',
    description: 'High-precision GPT models for strategic advisory & architecture',
  },
  {
    id: 'ollama',
    label: 'Local Ollama (Offline / Free)',
    models: ['llama3.2', 'llama3.1', 'mistral', 'qwen2.5', 'phi3'],
    default_model: 'llama3.2',
    needs_key: false,
    key_url: 'https://ollama.com',
    key_hint: 'Download at ollama.com',
    description: 'Runs 100% locally on your machine with zero API cost',
  },
];

const PROVIDER_META = {
  gemini: { icon: Sparkles, iconColor: 'text-cyan-400', badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  groq: { icon: Zap, iconColor: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  openai: { icon: Brain, iconColor: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  ollama: { icon: Server, iconColor: 'text-purple-400', badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
};

export default function LlmSettingsModal({
  isOpen,
  onClose,
  llmStatus,
  onStatusUpdated,
}) {
  // Merge backend providers if available, or use comprehensive default list
  const providers = (llmStatus?.all_providers && llmStatus.all_providers.length > 0)
    ? llmStatus.all_providers.map((p) => {
        const def = DEFAULT_PROVIDERS.find((d) => d.id === p.id);
        return {
          ...def,
          ...p,
          models: p.models?.length ? p.models : def?.models || [],
          default_model: p.default_model || def?.default_model || '',
        };
      })
    : DEFAULT_PROVIDERS;

  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);

  // Sync state whenever modal opens or llmStatus changes
  useEffect(() => {
    if (!isOpen) return;

    // Determine default initial provider
    const initProvId = llmStatus?.provider || selectedProvider || 'gemini';
    setSelectedProvider(initProvId);

    const provObj = providers.find((p) => p.id === initProvId) || providers[0];
    if (llmStatus?.model && provObj?.models?.includes(llmStatus.model)) {
      setModel(llmStatus.model);
    } else {
      setModel(provObj?.default_model || provObj?.models?.[0] || '');
    }

    setTestResult(null);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Check backend connection in background
    fetchLLMStatus()
      .then((data) => {
        setServerOffline(false);
        if (data && onStatusUpdated && (!llmStatus || !llmStatus.provider)) {
          onStatusUpdated(data);
        }
      })
      .catch(() => {
        setServerOffline(true);
      });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeProviderId = selectedProvider || llmStatus?.provider || 'gemini';
  const currentProv = providers.find((p) => p.id === activeProviderId) || providers[0];
  const activeModels = currentProv?.models || [];
  const selectedModel = model || currentProv?.default_model || activeModels[0] || '';

  const handleSelectProvider = (provId) => {
    setSelectedProvider(provId);
    const provObj = providers.find((p) => p.id === provId);
    if (provObj && provObj.models?.length > 0) {
      setModel(provObj.default_model || provObj.models[0]);
    }
    setTestResult(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testLLM({
        provider: activeProviderId,
        api_key: apiKey,
        model: selectedModel,
      });
      setServerOffline(false);
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Connection verified successfully!' : 'Connection test failed.'),
      });
    } catch (err) {
      const isNetworkErr = err.message?.toLowerCase().includes('failed to fetch') || !err.message;
      if (isNetworkErr) setServerOffline(true);
      setTestResult({
        success: false,
        message: isNetworkErr
          ? 'Backend server unreachable at http://127.0.0.1:8765. Make sure python server.py is running.'
          : (err.message || 'Connection test failed.'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      const res = await configureLLM({
        provider: activeProviderId,
        api_key: apiKey,
        model: selectedModel,
      });
      setServerOffline(false);
      if (res.status === 'configured' || res.active || res.success) {
        onStatusUpdated(res);
        onClose();
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Configuration could not be saved.',
        });
      }
    } catch (err) {
      const isNetworkErr = err.message?.toLowerCase().includes('failed to fetch') || !err.message;
      if (isNetworkErr) setServerOffline(true);
      setTestResult({
        success: false,
        message: isNetworkErr
          ? 'Backend server unreachable at http://127.0.0.1:8765. Start backend via "python server.py" in your terminal.'
          : (err.message || 'Save failed.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryServer = async () => {
    try {
      const data = await fetchLLMStatus();
      setServerOffline(false);
      setTestResult({ success: true, message: 'Connected to backend server!' });
      if (onStatusUpdated) onStatusUpdated(data);
    } catch {
      setServerOffline(true);
      setTestResult({
        success: false,
        message: 'Backend server still unreachable at http://127.0.0.1:8765. Please start "python server.py".',
      });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="llm-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-dark-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-dark-850/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 id="llm-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                <span>LLM Configuration</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Switch Provider
                </span>
              </h3>
              <p className="text-xs text-slate-400">Configure your preferred AI language model provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Offline Warning Banner (if backend is not started) */}
        {serverOffline && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Backend server is offline (<code>http://127.0.0.1:8765</code>). Run <strong><code>python server.py</code></strong> in your terminal to enable live connection.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRetryServer}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Provider Selection Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select AI Provider (Click to change)
              </label>
              <span className="text-[11px] text-slate-400">4 Providers Available</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providers.map((prov) => {
                const meta = PROVIDER_META[prov.id] || PROVIDER_META.ollama;
                const Icon = meta.icon;
                const isSelected = activeProviderId === prov.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => handleSelectProvider(prov.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-dark-800 border-cyan-500 shadow-md shadow-cyan-500/10 ring-2 ring-cyan-500/40'
                        : 'bg-dark-850/60 border-slate-800 hover:border-slate-600 hover:bg-dark-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                        <span className="text-sm font-bold text-white">{prov.label}</span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 hover:border-slate-500" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      {prov.description || (prov.needs_key ? 'Requires API key' : 'Runs locally without an API key')}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                        prov.needs_key
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}>
                        {prov.needs_key ? 'API Key' : 'Local / Free'}
                      </span>
                      {prov.default_model && (
                        <span className="text-slate-400 font-mono text-[10px]">{prov.default_model}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Config Form for Selected Provider */}
          <div className="p-5 rounded-2xl bg-dark-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs text-slate-400 font-medium">Configuring Provider:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-lg bg-dark-800 border border-slate-700">
                  {currentProv?.label || 'Selected Provider'}
                </span>
                {currentProv?.key_url && (
                  <a
                    href={currentProv.key_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>{currentProv.key_hint || 'Get API Key'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {currentProv?.needs_key ? (
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>API Key for {currentProv?.label}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Stored safely in local .env</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Paste your ${currentProv?.label} API key here...`}
                  className="w-full bg-dark-900 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 outline-none focus:border-cyan-400 transition-colors"
                  autoComplete="off"
                />
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200 space-y-1">
                <p className="font-semibold text-purple-100 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>Local Offline Ollama Server</span>
                </p>
                <p className="text-slate-300 text-[11px]">
                  Ollama runs locally at <code>http://127.0.0.1:11434</code> with no API key needed.
                </p>
                <p className="text-slate-400 text-[11px]">
                  Make sure Ollama is installed and run: <code className="bg-dark-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">ollama run {selectedModel || 'llama3.2'}</code>
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-dark-900 text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 outline-none focus:border-cyan-400 cursor-pointer"
              >
                {activeModels.map((availableModel) => (
                  <option key={availableModel} value={availableModel}>
                    {availableModel} {availableModel === currentProv?.default_model ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Test / Save result banner */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border border-red-500/30'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Test Connection</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span>Save & Activate Provider</span>
              </button>
            </div>
          </div>

          {/* Current Active Status Footer */}
          <div className="p-4 rounded-xl bg-dark-850/50 border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
              <span className={`font-bold ${llmStatus?.active ? 'text-emerald-400' : 'text-amber-400'}`}>
                {llmStatus?.active ? 'Active' : 'Not Configured'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Provider</span>
              <span className="text-slate-200 font-mono font-medium">
                {llmStatus?.provider || 'None'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Model</span>
              <span className="text-slate-200 font-mono font-medium truncate block">
                {llmStatus?.model || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
