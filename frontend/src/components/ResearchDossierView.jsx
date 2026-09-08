import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Lightbulb,
  Database,
  Globe,
  Target,
  MessageSquare,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Star,
  Send,
  Bot,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';
import { chatResearchAgent, exportResearchReport } from '../utils/api';
import { Magnet } from './reactbits';
import { SpiderSense, SpiderWeb, SpiderTracer } from './SpiderIcons';
import spidermanHangingImg from '../assets/spiderman-hanging.png';
import spiderGwenSittingImg from '../assets/spider-gwen-sitting.png';

export default function ResearchDossierView({
  researchData,
  onOpenProblemStatement,
  onToast,
}) {
  const [activeTab, setActiveTab] = useState('synthesis');
  const [isCotExpanded, setIsCotExpanded] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Dynamic Spider-Man web extension on scroll
  const [webLength, setWebLength] = useState(20);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const windowScroll = window.scrollY || 0;
      const chatScroll = chatMessagesRef.current ? chatMessagesRef.current.scrollTop : 0;
      const totalScroll = windowScroll + chatScroll;
      // Web extends gently by a subtle amount (up to 85px extension, max length 105px)
      const extension = Math.min(85, Math.floor(totalScroll * 0.2));
      setWebLength(20 + extension);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChatScroll = () => {
    const windowScroll = window.scrollY || 0;
    const chatScroll = chatMessagesRef.current ? chatMessagesRef.current.scrollTop : 0;
    const totalScroll = windowScroll + chatScroll;
    const extension = Math.min(85, Math.floor(totalScroll * 0.2));
    setWebLength(20 + extension);
  };

  if (!researchData) return null;

  const {
    query,
    title,
    knowledge = {},
    papers = [],
    patents = [],
    datasets = [],
    repositories = [],
    problem_statements = [],
    dossier = {},
    chain_of_thought = [],
    total_sources = 0,
    llm_powered = false,
  } = researchData;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
    if (onToast) onToast('Copied to clipboard!', 'info');
  };

  const handleExport = async () => {
    try {
      const res = await exportResearchReport(researchData);
      const markdown = res.markdown || '# Research Report';
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Research_Dossier_${query.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onToast) onToast('Research dossier downloaded!', 'success');
    } catch (err) {
      if (onToast) onToast('Export failed: ' + err.message, 'warning');
    }
  };

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const apiHistory = newHistory.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chatResearchAgent(
        {
          query,
          dossier,
          papers,
          patents,
          datasets,
        },
        userMsg,
        apiHistory
      );
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply || 'No response generated.' },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error communicating with Research Agent: ${err.message}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const quickChatPrompts = [
    'What are the core technical bottlenecks?',
    'Compare the methodologies across retrieved papers.',
    'Suggest a step-by-step prototyping stack.',
    'Where is the patent white-space for novelty?',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="relative rounded-xl glass-panel border border-red-950/80 p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-900/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-200 border border-red-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <SpiderSense className="w-3.5 h-3.5 text-cyan-400" />
                Autonomous Research Dossier
              </span>
              <span className="px-2.5 py-1 rounded-md bg-dark-950 text-cyan-300 border border-cyan-500/30 text-xs font-semibold font-mono">
                {total_sources} Verified Sources
              </span>
              {llm_powered ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
                  AI Synthesized
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-dark-950 text-slate-300 text-[11px] border border-red-950/80">
                  Smart Heuristic Synthesis
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
              Cross-disciplinary investigation synthesizing academic literature, patents, open datasets, and implementation frameworks for <span className="text-cyan-300 font-semibold">"{query}"</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Magnet padding={20} magnetStrength={0.2}>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-sm shadow-red-950/60 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Export Dossier (.md)</span>
              </button>
            </Magnet>
          </div>
        </div>

        {/* Chain of Thought Toggle */}
        {chain_of_thought.length > 0 && (
          <div className="mt-5 pt-4 border-t border-red-950/80">
            <button
              onClick={() => setIsCotExpanded(!isCotExpanded)}
              className="flex items-center justify-between w-full text-left text-xs font-medium text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="font-semibold text-slate-200">Agent Cognitive Reasoning:</span> 4-Stage Multi-Source Corroboration
              </span>
              {isCotExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isCotExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                {chain_of_thought.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-dark-950/80 border border-red-950/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-red-400 font-semibold text-[11px]">
                      <span>Stage {step.step || idx + 1}: {step.actor || 'Core'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="font-medium text-slate-200">{step.stage}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {step.thought}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 rounded-xl bg-dark-950/90 border border-red-950/80 backdrop-blur-md scrollbar-none">
        {[
          { id: 'synthesis', label: 'Research Dossier', icon: SpiderSense, count: null },
          { id: 'papers', label: 'Academic Papers', icon: BookOpen, count: papers.length },
          { id: 'patents', label: 'Patents & IP', icon: SpiderWeb, count: patents.length },
          { id: 'datasets', label: 'Datasets & Code', icon: Database, count: datasets.length + repositories.length },
          { id: 'knowledge', label: 'Knowledge Graph', icon: Globe, count: knowledge.related_topics ? knowledge.related_topics.length : null },
          { id: 'challenges', label: 'Applied Challenges', icon: SpiderTracer, count: problem_statements.length },
          { id: 'chat', label: 'Research Agent Chat', icon: MessageSquare, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white border border-red-500/40 shadow-sm shadow-red-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-dark-850/80 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-dark-950 text-slate-400 border border-white/5'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Research Dossier / Synthesis */}
      {activeTab === 'synthesis' && (
        <div className="space-y-6">
          {/* Executive Summary & SOTA Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-400" />
                  Executive Research Synthesis
                </h2>
                <button
                  onClick={() => handleCopy(dossier.executive_summary, 'exec')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-dark-850 transition-colors cursor-pointer"
                >
                  {copiedSection === 'exec' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none">
                {renderMarkdown(dossier.executive_summary)}
              </div>
            </div>

            <div className="p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                State of the Art (SOTA)
              </h2>
              <div className="text-slate-300 text-sm leading-relaxed">
                {renderMarkdown(dossier.state_of_the_art)}
              </div>
            </div>
          </div>

          {/* Technical Deep Dive */}
          <div className="p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Technical & Architectural Deep Dive
            </h2>
            <div className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none">
              {renderMarkdown(dossier.technical_deep_dive)}
            </div>
          </div>

          {/* Key Findings & Open Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Key Empirical Literature Findings
              </h2>
              <ul className="space-y-2.5">
                {(dossier.key_findings || []).map((finding, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-dark-950/70 border border-red-950/60 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Critical Open Challenges & Bottlenecks
              </h2>
              <ul className="space-y-2.5">
                {(dossier.open_challenges || []).map((challenge, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-dark-950/70 border border-red-950/60 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      !
                    </span>
                    <span className="leading-relaxed">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Stack & Roadmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                Recommended Tooling & Stack
              </h2>
              {dossier.recommended_stack && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1.5">
                      Core Frameworks
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(dossier.recommended_stack.core_frameworks || []).map((f, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-dark-950 border border-red-950/80 text-cyan-300 font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1.5">
                      Benchmark Datasets & Models
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(dossier.recommended_stack.datasets_models || []).map((d, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-dark-950 border border-red-950/80 text-blue-300 font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block mb-1.5">
                      Hardware & Deployment Infra
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(dossier.recommended_stack.hardware_infra || []).map((h, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-dark-950 border border-red-950/80 text-purple-300 font-medium">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Phased Research & Prototyping Roadmap
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(dossier.research_roadmap || []).map((phase, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-dark-950/70 border border-red-950/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-semibold">
                      <span>{phase.phase}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-dark-950 text-slate-300 border border-white/10">
                        {phase.duration || `Phase ${idx + 1}`}
                      </span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {(phase.milestones || []).map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Papers */}
      {activeTab === 'papers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Peer-Reviewed Literature ({papers.length})
            </h2>
            <span className="text-xs text-slate-400">Retrieved from CrossRef & arXiv with DOIs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {papers.map((paper, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl glass-panel glass-panel-hover transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-dark-950 text-cyan-300 border border-cyan-500/30 font-medium font-mono">
                      {paper.source || 'CrossRef'}
                    </span>
                    <span className="text-slate-400">{paper.year || 'Recent'}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                    {paper.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {Array.isArray(paper.authors) ? paper.authors.slice(0, 3).join(', ') : 'Unknown Authors'}
                  </p>

                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                    {paper.abstract}
                  </p>

                  {paper.research_takeaway && (
                    <div className="mt-3 p-3 rounded-lg bg-dark-950/90 border border-red-950/80 text-xs text-slate-200 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-red-300">Methodology Takeaway: </span>
                        {paper.research_takeaway}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-red-950/60 text-xs">
                  {paper.doi ? (
                    <span className="text-slate-500 truncate max-w-[200px]">DOI: {paper.doi}</span>
                  ) : (
                    <span className="text-slate-500">Open Access</span>
                  )}
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold"
                    >
                      Read Paper
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Patents & Prior Art */}
      {activeTab === 'patents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Google Patents & IP Prior Art ({patents.length})
            </h2>
            <span className="text-xs text-slate-400">Patent Publications & Prior-Art Novelty Gaps</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patents.map((patent, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl glass-panel glass-panel-hover transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold font-mono">
                      {patent.patent_id || 'Patent'}
                    </span>
                    <span className="text-slate-400">{patent.filing_date || patent.publication_date || 'Published'}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {patent.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Assignee: {patent.assignee || 'Commercial Applicant'}
                  </p>

                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                    {patent.abstract || 'Patent claims prior-art system formulation and industrial embodiments.'}
                  </p>

                  {patent.novelty_advisory && (
                    <div className="mt-3 p-3 rounded-lg bg-dark-950/90 border border-amber-900/40 text-xs text-slate-200 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300">Novelty & Differentiation Angle: </span>
                        {patent.novelty_advisory}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-red-950/60 text-xs">
                  <span className="text-slate-500">Google Patents Database</span>
                  {patent.patent_url && (
                    <a
                      href={patent.patent_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      View Patent
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Datasets & Code */}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          {/* Datasets Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Open-Access Datasets (Hugging Face)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((ds, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl glass-panel glass-panel-hover transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="text-cyan-400 font-medium font-mono">{ds.author}</span>
                      {ds.downloads && <span>📥 {ds.downloads}</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">{ds.name}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{ds.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {(ds.tags || []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-dark-950 text-slate-300 text-[10px] border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={ds.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-dark-950 hover:bg-dark-850 text-cyan-300 hover:text-white text-xs font-semibold transition-colors border border-cyan-500/30 hover:border-cyan-400"
                  >
                    Open on Hugging Face
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Repositories Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-400" />
              Open-Source Implementations & Benchmarks (GitHub)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl glass-panel glass-panel-hover transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="text-purple-400 font-medium font-mono">{repo.language || 'Code'}</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5" />
                        {repo.stars}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">{repo.name}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{repo.description}</p>
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-dark-950 hover:bg-dark-850 text-purple-300 hover:text-white text-xs font-semibold transition-colors border border-purple-500/30 hover:border-purple-400"
                  >
                    View on GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Knowledge Graph */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-semibold uppercase tracking-wider">
                  Encyclopedic Knowledge
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">{knowledge.title || title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{knowledge.description}</p>
              </div>
              {knowledge.thumbnail && (
                <img
                  src={knowledge.thumbnail}
                  alt={knowledge.title}
                  className="w-24 h-24 rounded-xl object-cover border border-red-950/80 shadow-md shrink-0"
                />
              )}
            </div>

            <div className="text-slate-300 text-sm leading-relaxed border-t border-red-950/60 pt-4">
              {knowledge.extract || 'Encyclopedic overview and taxonomy definitions.'}
            </div>

            {knowledge.page_url && (
              <div className="pt-2">
                <a
                  href={knowledge.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View Full Wikipedia Article
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Related Entities */}
          {knowledge.related_topics && knowledge.related_topics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
                Connected Concepts & Related Entities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {knowledge.related_topics.map((t, i) => (
                  <div key={i} className="p-3.5 rounded-lg glass-panel glass-panel-hover text-xs space-y-1">
                    <h4 className="font-semibold text-white">{t.title}</h4>
                    <p className="text-slate-400 line-clamp-2">{t.description}</p>
                    {t.url && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1"
                      >
                        Explore <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Applied Challenges / Problem Statements */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-red-400" />
              Applied Problem Statements & Hackathon Challenges ({problem_statements.length})
            </h2>
            <span className="text-xs text-slate-400">Real-World Challenges Matching This Research Domain</span>
          </div>

          {problem_statements.length === 0 ? (
            <div className="p-8 text-center rounded-xl glass-panel border border-red-950/70 text-slate-400 text-sm">
              No specific hackathon problem statements directly mapped to this academic query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {problem_statements.map((ps, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl glass-panel glass-panel-hover transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-dark-950 text-cyan-400 border border-cyan-500/30 font-bold font-mono">
                        {ps.id}
                      </span>
                      <span className="text-slate-400">{ps.category || 'Software'}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {ps.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Organization: {ps.organization || 'Government Body'}
                    </p>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {ps.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {(ps.tech_keywords || []).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-dark-950 text-slate-300 text-[10px] border border-white/5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-red-950/60 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{ps.domain || 'Technology'}</span>
                    {onOpenProblemStatement && (
                      <Magnet padding={18} magnetStrength={0.2}>
                        <button
                          onClick={() => onOpenProblemStatement(ps)}
                          className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-sm shadow-red-950/60 flex items-center gap-1.5 cursor-pointer"
                        >
                          <SpiderWeb className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                          <span>Open SIH Deep Dive</span>
                        </button>
                      </Magnet>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: AI Research Agent Chat */}
      {activeTab === 'chat' && (
        <div className="relative p-6 rounded-xl glass-panel border border-red-950/70 backdrop-blur-md space-y-4">
          {/* Top-Left Hanging Spider-Man with Dynamic Extending Web */}
          <div className="absolute top-0 left-5 md:left-8 pointer-events-none z-20 flex flex-col items-center select-none">
            {/* Top Web Anchor Pad */}
            <div className="w-3 h-1 bg-white/80 rounded-full blur-[0.4px] shadow-[0_0_8px_rgba(255,255,255,0.9)]" />

            {/* Elastic Extending Web Line */}
            <div
              className="w-[2px] bg-gradient-to-b from-white/95 via-slate-200 to-white/90 shadow-[0_0_8px_rgba(255,255,255,0.85)] transition-[height] duration-250 ease-out"
              style={{ height: `${webLength}px` }}
            />

            {/* Spider-Man Hanging from the Web */}
            <div className="animate-spider-sway origin-top -mt-2.5 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)]">
              <img
                src={spidermanHangingImg}
                alt="Spider-Man Hanging"
                className="w-20 md:w-24 h-auto object-contain select-none pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-red-950/80 pb-4 pl-16 md:pl-20">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-red-400" />
                Interactive AI Research Partner
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-turn intelligence agent grounded in all {total_sources} retrieved papers, patents, and datasets for "{query}".
              </p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickChatPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setChatInput(p);
                }}
                className="px-3 py-1.5 rounded-lg bg-dark-950 hover:bg-dark-850 text-slate-300 hover:text-white text-xs transition-colors border border-red-950/80 hover:border-red-500/40 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div
            ref={chatMessagesRef}
            onScroll={handleChatScroll}
            className="min-h-[280px] max-h-[480px] overflow-y-auto space-y-3.5 pr-2"
          >
            {chatMessages.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Bot className="w-8 h-8 text-red-500/60 mx-auto" />
                <p className="text-slate-300 font-medium text-sm">
                  Ready to assist with your investigation on "{title}".
                </p>
                <p>Ask about paper methodology comparisons, algorithmic formulations, or implementation blueprints.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-dark-950 text-red-400 flex items-center justify-center shrink-0 border border-red-950/80 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl max-w-2xl ${
                      msg.role === 'user'
                        ? 'bg-red-600 text-white rounded-tr-sm shadow-sm shadow-red-950/60'
                        : 'bg-dark-950 border border-red-950/80 text-slate-200 rounded-tl-sm prose prose-invert max-w-none'
                    }`}
                  >
                    {renderMarkdown(msg.content)}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isChatLoading && (
              <div className="flex gap-3 items-center text-xs text-red-400">
                <div className="w-7 h-7 rounded-lg bg-dark-950 text-red-400 flex items-center justify-center shrink-0 border border-red-950/80 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="animate-pulse font-medium">Synthesizing answer from literature & patents...</span>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-red-950/80">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask any question regarding ${title}...`}
              className="flex-1 px-4 py-2.5 rounded-lg bg-dark-950 border border-red-950/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors"
            />
            <div className="relative shrink-0 flex items-center">
              {/* Sitting Spider-Gwen leaning back on the left edge of the Send button */}
              <div className="absolute -top-[62px] -left-[108px] pointer-events-none z-20 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] animate-gwen-bob select-none">
                <img
                  src={spiderGwenSittingImg}
                  alt="Spider-Gwen Sitting"
                  className="w-[115px] h-auto object-contain select-none"
                />
              </div>

              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-red-950/60 active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
