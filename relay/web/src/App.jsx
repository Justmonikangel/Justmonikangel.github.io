import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Download,
  Send,
  ArrowLeftRight,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileQuestion,
  X,
  KeyRound,
  Check,
  Settings,
} from 'lucide-react'
import { api, setToken, streamTurn } from './api'

const ROLE_LABEL = {
  user: '我',
  claude: 'Claude',
  gpt: 'GPT',
  system: 'system',
}

export default function App() {
  const [sessions, setSessions] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [turns, setTurns] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [dragHover, setDragHover] = useState(false)
  const [streaming, setStreaming] = useState(null)
  const [streamingText, setStreamingText] = useState('')
  const [errorBanner, setErrorBanner] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [tokenInput, setTokenInput] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('relay-token') || '' : ''))
  const [busy, setBusy] = useState(false)
  const claudeColRef = useRef(null)
  const gptColRef = useRef(null)

  useEffect(() => {
    reloadSessions()
    api.listSkills().then(setAvailableSkills).catch(() => setAvailableSkills([]))
  }, [])

  useEffect(() => {
    if (!currentId) {
      setManifest(null)
      setTurns([])
      return
    }
    refreshSession(currentId)
  }, [currentId])

  useEffect(() => {
    if (streaming === 'claude') scrollToEnd(claudeColRef)
    if (streaming === 'gpt') scrollToEnd(gptColRef)
  }, [streamingText, streaming])

  function scrollToEnd(ref) {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }

  async function reloadSessions() {
    try {
      const list = await api.listSessions()
      setSessions(list)
    } catch (err) {
      setErrorBanner(`failed to list sessions: ${err.message}`)
    }
  }

  async function refreshSession(id) {
    try {
      const [m, t] = await Promise.all([api.getSession(id), api.getTurns(id)])
      setManifest(m)
      setTurns(Array.isArray(t) ? t : [])
    } catch (err) {
      setErrorBanner(`load failed: ${err.message}`)
    }
  }

  async function handleNew() {
    const title = window.prompt('Session 标题', '新一轮修改') || 'untitled'
    try {
      const m = await api.createSession(title)
      await reloadSessions()
      setCurrentId(m.id)
    } catch (err) {
      setErrorBanner(`create failed: ${err.message}`)
    }
  }

  async function handleFork() {
    if (!manifest) return
    try {
      await api.downloadFork(manifest.id, `${manifest.title || 'session'}-${manifest.id.slice(0, 8)}.tar.gz`)
    } catch (err) {
      setErrorBanner(`fork failed: ${err.message}`)
    }
  }

  async function handleSkillToggle(name) {
    if (!manifest) return
    const enabled = manifest.skills.includes(name)
    const next = enabled ? manifest.skills.filter((s) => s !== name) : [...manifest.skills, name]
    try {
      const updated = await api.patchSession(manifest.id, { skills: next })
      setManifest(updated)
    } catch (err) {
      setErrorBanner(`skill toggle failed: ${err.message}`)
    }
  }

  async function onDrop(e) {
    e.preventDefault()
    setDragHover(false)
    if (!currentId) {
      setErrorBanner('先建一个 session 再拖文件')
      return
    }
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    setBusy(true)
    try {
      const uploaded = await api.upload(currentId, files)
      setAttachments((prev) => [...prev, ...uploaded])
    } catch (err) {
      setErrorBanner(`upload failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  function removeAttachment(id) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  async function send(target, { withMessage }) {
    if (!currentId) return
    if (withMessage && !input.trim() && !attachments.length) return
    setErrorBanner('')
    setStreaming(target)
    setStreamingText('')

    const messagePayload = withMessage ? { content: input, attachments } : undefined
    if (withMessage) {
      setInput('')
      setAttachments([])
    }

    try {
      await streamTurn(
        currentId,
        { target, message: messagePayload },
        {
          onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
          onError: (msg) => setErrorBanner(msg),
        },
      )
    } catch (err) {
      setErrorBanner(err.message)
    } finally {
      setStreaming(null)
      setStreamingText('')
      await refreshSession(currentId)
      await reloadSessions()
    }
  }

  function saveToken() {
    setToken(tokenInput.trim())
    setShowSettings(false)
    reloadSessions()
  }

  const claudeTurns = useMemo(() => turns.filter((t) => t.role === 'claude'), [turns])
  const gptTurns = useMemo(() => turns.filter((t) => t.role === 'gpt'), [turns])
  const userTurns = useMemo(() => turns.filter((t) => t.role === 'user'), [turns])

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <TopBar
        sessions={sessions}
        currentId={currentId}
        onPick={setCurrentId}
        onNew={handleNew}
        onFork={handleFork}
        canFork={Boolean(manifest)}
        onToggleSettings={() => setShowSettings((v) => !v)}
        manifest={manifest}
        availableSkills={availableSkills}
        onSkillToggle={handleSkillToggle}
      />
      {errorBanner ? (
        <div className="border-b border-red-900/50 bg-red-950/40 px-4 py-2 text-xs text-red-300 flex items-center gap-2">
          <span className="flex-1">{errorBanner}</span>
          <button onClick={() => setErrorBanner('')} className="hover:text-red-100"><X size={14} /></button>
        </div>
      ) : null}
      {showSettings ? (
        <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm">
          <label className="flex items-center gap-2">
            <KeyRound size={14} className="text-zinc-400" />
            <span className="text-zinc-400">RELAY_TOKEN</span>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 rounded bg-zinc-800 px-2 py-1 outline-none focus:ring-1 focus:ring-zinc-600"
              placeholder="如果后端没设 RELAY_TOKEN 就留空"
              type="password"
              autoComplete="off"
            />
            <button onClick={saveToken} className="flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-xs hover:bg-emerald-600">
              <Check size={14} /> 存
            </button>
          </label>
        </div>
      ) : null}
      <div className="grid flex-1 grid-cols-12 gap-px overflow-hidden bg-zinc-800">
        <ModelColumn
          title="Claude"
          accent="text-amber-300"
          colRef={claudeColRef}
          turns={claudeTurns}
          streaming={streaming === 'claude'}
          streamingText={streamingText}
          empty={currentId ? '让 Claude 说点什么——把 GPT 那边的反馈"原样发给我"按钮在中间。' : '左上角新建或选一个 session。'}
          className="col-span-4 bg-zinc-950"
        />
        <CenterPane
          className="col-span-4 bg-zinc-950"
          userTurns={userTurns}
          input={input}
          setInput={setInput}
          attachments={attachments}
          removeAttachment={removeAttachment}
          dragHover={dragHover}
          setDragHover={setDragHover}
          onDrop={onDrop}
          busy={busy}
          canSend={Boolean(currentId)}
          send={send}
          streaming={streaming}
          turns={turns}
        />
        <ModelColumn
          title="GPT"
          accent="text-emerald-300"
          colRef={gptColRef}
          turns={gptTurns}
          streaming={streaming === 'gpt'}
          streamingText={streamingText}
          empty={currentId ? '把稿件拖进中间输入框，然后 "Send → GPT"。' : '左上角新建或选一个 session。'}
          className="col-span-4 bg-zinc-950"
        />
      </div>
    </div>
  )
}

function TopBar({ sessions, currentId, onPick, onNew, onFork, canFork, onToggleSettings, manifest, availableSkills, onSkillToggle }) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="text-sm font-semibold tracking-wide text-zinc-300">relay</span>
        <span className="text-xs text-zinc-500">claude ↔ gpt</span>
        <div className="flex-1" />
        <select
          value={currentId ?? ''}
          onChange={(e) => onPick(e.target.value || null)}
          className="max-w-xs rounded bg-zinc-800 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="">— 选 session —</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.title || s.id.slice(0, 8)} · {s.turnCount} turns</option>
          ))}
        </select>
        <button onClick={onNew} className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700">
          <Plus size={14} /> 新建
        </button>
        <button
          onClick={onFork}
          disabled={!canFork}
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800"
        >
          <Download size={14} /> 派生到本地
        </button>
        <button onClick={onToggleSettings} className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700">
          <Settings size={14} />
        </button>
      </div>
      {manifest ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/60 px-4 py-2 text-xs text-zinc-400">
          <span className="text-zinc-500">skills:</span>
          {availableSkills.length === 0 ? <span className="text-zinc-600">（无）</span> : null}
          {availableSkills.map((name) => {
            const on = manifest.skills.includes(name)
            return (
              <button
                key={name}
                onClick={() => onSkillToggle(name)}
                className={
                  'rounded border px-2 py-0.5 ' +
                  (on
                    ? 'border-emerald-700/60 bg-emerald-900/30 text-emerald-200'
                    : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800')
                }
              >
                {on ? '✓ ' : ''}{name}
              </button>
            )
          })}
          <span className="flex-1" />
          <span className="text-zinc-600">compacted through turn {manifest.compactedThrough} · {manifest.turnCount} turns total</span>
        </div>
      ) : null}
    </div>
  )
}

function ModelColumn({ title, accent, colRef, turns, streaming, streamingText, empty, className }) {
  return (
    <div className={'flex flex-col overflow-hidden ' + (className || '')}>
      <div className="border-b border-zinc-800 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500">
        <span className={accent + ' font-semibold'}>{title}</span>
      </div>
      <div ref={colRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {turns.length === 0 && !streaming ? <div className="mt-8 text-center text-xs text-zinc-600">{empty}</div> : null}
        {turns.map((t) => (
          <TurnBubble key={`${t.role}-${t.index}`} turn={t} />
        ))}
        {streaming ? (
          <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
              <Loader2 size={10} className="animate-spin" /> streaming
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-100 streaming-cursor">{streamingText}</pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TurnBubble({ turn }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
        <span>turn {turn.index}</span>
        <span>·</span>
        <span>{ROLE_LABEL[turn.role] || turn.role}</span>
        {turn.tokens ? <span>· {turn.tokens} tok</span> : null}
      </div>
      {turn.attachments?.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {turn.attachments.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              <AttachmentIcon kind={a.kind} />{a.name}
            </span>
          ))}
        </div>
      ) : null}
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-100">{turn.content}</pre>
    </div>
  )
}

function CenterPane({ className, userTurns, input, setInput, attachments, removeAttachment, dragHover, setDragHover, onDrop, busy, canSend, send, streaming, turns }) {
  const lastAssistant = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      if (turns[i].role === 'claude' || turns[i].role === 'gpt') return turns[i].role
    }
    return null
  }, [turns])
  const relayTarget = lastAssistant === 'claude' ? 'gpt' : lastAssistant === 'gpt' ? 'claude' : null

  return (
    <div className={'flex flex-col overflow-hidden ' + (className || '')}>
      <div className="border-b border-zinc-800 px-4 py-2 text-xs uppercase tracking-wider text-zinc-500">
        <span className="font-semibold text-zinc-300">我</span>
        <span className="ml-2 text-zinc-600">坐在中间审稿</span>
      </div>
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {userTurns.length === 0 ? (
          <div className="mt-8 text-center text-xs text-zinc-600">还没发过话。下面输入框写指令、拖文件，按 "Send → claude / gpt"。</div>
        ) : null}
        {userTurns.map((t) => <TurnBubble key={`u-${t.index}`} turn={t} />)}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragHover(true) }}
        onDragLeave={() => setDragHover(false)}
        onDrop={onDrop}
        className={
          'border-t border-zinc-800 px-4 py-3 ' +
          (dragHover ? 'bg-emerald-950/30 ring-1 ring-emerald-700/50' : '')
        }
      >
        {attachments.length ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {attachments.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                <AttachmentIcon kind={a.kind} />{a.name}
                <button onClick={() => removeAttachment(a.id)} className="ml-1 text-zinc-500 hover:text-zinc-200"><X size={12} /></button>
              </span>
            ))}
          </div>
        ) : null}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={canSend ? '在这里写指令；可以把 PDF / 图片 / .md 直接拖进来…' : '先新建或选一个 session'}
          disabled={!canSend || Boolean(streaming)}
          rows={4}
          className="w-full resize-none rounded bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              send('claude', { withMessage: true })
            }
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => send('claude', { withMessage: true })}
            disabled={!canSend || Boolean(streaming) || (!input.trim() && !attachments.length)}
            className="flex items-center gap-1 rounded bg-amber-700 px-3 py-1.5 text-amber-50 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-700"
          >
            <Send size={12} /> Send → Claude
          </button>
          <button
            onClick={() => send('gpt', { withMessage: true })}
            disabled={!canSend || Boolean(streaming) || (!input.trim() && !attachments.length)}
            className="flex items-center gap-1 rounded bg-emerald-700 px-3 py-1.5 text-emerald-50 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-700"
          >
            <Send size={12} /> Send → GPT
          </button>
          <button
            onClick={() => relayTarget && send(relayTarget, { withMessage: false })}
            disabled={!canSend || Boolean(streaming) || !relayTarget}
            className="flex items-center gap-1 rounded border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
            title="把另一方刚才的输出原样转给对面"
          >
            <ArrowLeftRight size={12} /> Relay {relayTarget ? `→ ${relayTarget === 'claude' ? 'Claude' : 'GPT'}` : ''}
          </button>
          {busy ? <span className="text-zinc-500"><Loader2 size={12} className="inline animate-spin" /> 上传中</span> : null}
          <span className="flex-1" />
          <span className="text-zinc-600">⌘/Ctrl + Enter → Claude</span>
        </div>
      </div>
    </div>
  )
}

function AttachmentIcon({ kind }) {
  if (kind === 'image') return <ImageIcon size={10} />
  if (kind === 'pdf' || kind === 'text') return <FileText size={10} />
  return <FileQuestion size={10} />
}
