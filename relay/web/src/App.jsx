import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Download,
  SlidersHorizontal,
  ArrowLeftRight,
  Send,
  Paperclip,
  X,
  Plus,
  KeyRound,
  Check,
  Loader2,
} from 'lucide-react'
import { api, setToken, streamTurn } from './api'

const ROLE_LABEL = { user: '我', claude: 'Claude', gpt: 'GPT' }

export default function App() {
  const [sessions, setSessions] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [manifest, setManifest] = useState(null)
  const [turns, setTurns] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [showSkills, setShowSkills] = useState(false)

  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  const [activeStreaming, setActiveStreaming] = useState(null)
  const [streamingText, setStreamingText] = useState('')

  const [error, setError] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [tokenInput, setTokenInput] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('relay-token') || '' : '',
  )
  const [busy, setBusy] = useState(false)

  const claudeRef = useRef(null)
  const gptRef = useRef(null)

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
    if (activeStreaming === 'claude' && claudeRef.current) {
      claudeRef.current.scrollTop = claudeRef.current.scrollHeight
    }
    if (activeStreaming === 'gpt' && gptRef.current) {
      gptRef.current.scrollTop = gptRef.current.scrollHeight
    }
  }, [streamingText, activeStreaming])

  async function reloadSessions() {
    try {
      setSessions(await api.listSessions())
    } catch (err) {
      setError(`无法连接后端：${err.message}`)
    }
  }

  async function refreshSession(id) {
    try {
      const [m, t] = await Promise.all([api.getSession(id), api.getTurns(id)])
      setManifest(m)
      setTurns(Array.isArray(t) ? t : [])
    } catch (err) {
      setError(`session 加载失败：${err.message}`)
    }
  }

  async function handleNew() {
    const title = window.prompt('Session 标题', '新一轮修改')
    if (title === null) return
    try {
      const m = await api.createSession(title || 'untitled')
      await reloadSessions()
      setCurrentId(m.id)
    } catch (err) {
      setError(`创建失败：${err.message}`)
    }
  }

  async function handleFork() {
    if (!manifest) return
    try {
      await api.downloadFork(manifest.id, `${manifest.title || 'session'}-${manifest.id.slice(0, 8)}.tar.gz`)
    } catch (err) {
      setError(`派生失败：${err.message}`)
    }
  }

  async function handleSkillToggle(name) {
    if (!manifest) return
    const enabled = manifest.skills.includes(name)
    const next = enabled ? manifest.skills.filter((s) => s !== name) : [...manifest.skills, name]
    try {
      setManifest(await api.patchSession(manifest.id, { skills: next }))
    } catch (err) {
      setError(`skill 切换失败：${err.message}`)
    }
  }

  function onDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }
  function onDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }
  async function onDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    if (!currentId) {
      setError('先新建或选一个 session 再拖文件')
      return
    }
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return
    setBusy(true)
    try {
      const uploaded = await api.upload(currentId, files)
      setAttachments((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(`上传失败：${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  function removeAttachment(id) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  async function runStream(target, withMessage) {
    if (!currentId) return
    if (withMessage && !input.trim() && !attachments.length) return
    setError('')
    setActiveStreaming(target)
    setStreamingText('')

    const messagePayload = withMessage ? { content: input, attachments } : undefined
    if (withMessage) {
      setInput('')
      setAttachments([])
    }

    try {
      await streamTurn(currentId, { target, message: messagePayload }, {
        onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
        onError: (msg) => setError(msg),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setActiveStreaming(null)
      setStreamingText('')
      await refreshSession(currentId)
      await reloadSessions()
    }
  }

  function saveToken() {
    setToken(tokenInput.trim())
    setShowToken(false)
    reloadSessions()
  }

  const claudeTurns = useMemo(() => turns.filter((t) => t.role === 'claude'), [turns])
  const gptTurns = useMemo(() => turns.filter((t) => t.role === 'gpt'), [turns])
  const userTurns = useMemo(() => turns.filter((t) => t.role === 'user'), [turns])

  const canSend = Boolean(currentId) && !activeStreaming
  const hasInput = input.trim().length > 0 || attachments.length > 0

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"></div>
        <div className="absolute top-[20%] left-[30%] w-[800px] h-[400px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[140px] opacity-20"></div>
      </div>

      <Header
        sessions={sessions}
        currentId={currentId}
        manifest={manifest}
        availableSkills={availableSkills}
        onPick={setCurrentId}
        onNew={handleNew}
        onFork={handleFork}
        canFork={Boolean(manifest)}
        showSkills={showSkills}
        setShowSkills={setShowSkills}
        onSkillToggle={handleSkillToggle}
        showToken={showToken}
        setShowToken={setShowToken}
        tokenInput={tokenInput}
        setTokenInput={setTokenInput}
        saveToken={saveToken}
      />

      {error ? (
        <div className="z-10 mx-auto mt-3 flex w-fit max-w-2xl items-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-4 py-2 text-xs text-red-700 backdrop-blur">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="hover:text-red-900"><X className="w-3 h-3" /></button>
        </div>
      ) : null}

      <main className="flex-1 flex overflow-hidden z-10">
        <ModelColumn
          side="left"
          name="Claude"
          accent="indigo"
          colRef={claudeRef}
          turns={claudeTurns}
          isStreaming={activeStreaming === 'claude'}
          streamingText={streamingText}
          emptyHint={currentId ? '让 Claude 接 GPT 的反馈——点底部的 "Relay to GPT" / "Relay to Claude"。' : '右上角新建或选一个 session。'}
          relayLabel="Relay to GPT"
          onRelay={() => canSend && runStream('gpt', false)}
          relayDisabled={!canSend || turns.length === 0}
        />

        <DirectorCanvas
          userTurns={userTurns}
          input={input}
          setInput={setInput}
          attachments={attachments}
          removeAttachment={removeAttachment}
          isDragging={isDragging}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          busy={busy}
          canSend={canSend}
          hasInput={hasInput}
          onSendClaude={() => runStream('claude', true)}
          onSendGpt={() => runStream('gpt', true)}
        />

        <ModelColumn
          side="right"
          name="GPT"
          accent="sky"
          colRef={gptRef}
          turns={gptTurns}
          isStreaming={activeStreaming === 'gpt'}
          streamingText={streamingText}
          emptyHint={currentId ? '把稿件拖进中间，点 "To GPT"。' : '右上角新建或选一个 session。'}
          relayLabel="Relay to Claude"
          onRelay={() => canSend && runStream('claude', false)}
          relayDisabled={!canSend || turns.length === 0}
        />
      </main>
    </div>
  )
}

function Header({
  sessions, currentId, manifest, availableSkills,
  onPick, onNew, onFork, canFork,
  showSkills, setShowSkills, onSkillToggle,
  showToken, setShowToken, tokenInput, setTokenInput, saveToken,
}) {
  return (
    <>
      <header className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-white/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <h1 className="text-sm font-semibold tracking-widest uppercase text-slate-800">Relay Control</h1>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${currentId ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-slate-300'}`}></span>
            <select
              value={currentId ?? ''}
              onChange={(e) => onPick(e.target.value || null)}
              className="max-w-[220px] bg-transparent text-xs text-slate-500 focus:outline-none cursor-pointer"
            >
              <option value="">— pick session —</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.title || s.id.slice(0, 8)} · {s.turnCount}t</option>
              ))}
            </select>
          </div>
          {manifest ? (
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {manifest.turnCount} turns · compacted thru {manifest.compactedThrough}
            </span>
          ) : null}
        </div>

        <div className="flex items-center space-x-4">
          <HeaderButton onClick={onNew} icon={Plus} label="New Session" />
          <Divider />
          <HeaderButton
            onClick={() => setShowSkills((v) => !v)}
            icon={SlidersHorizontal}
            label={manifest?.skills?.length ? `Skills (${manifest.skills.length})` : 'Skills'}
            active={Boolean(manifest?.skills?.length)}
            disabled={!manifest}
          />
          <HeaderButton onClick={onFork} icon={Download} label="Fork (.tar.gz)" disabled={!canFork} />
          <Divider />
          <HeaderButton
            onClick={() => setShowToken((v) => !v)}
            icon={KeyRound}
            label={tokenInput ? 'Token ✓' : 'Token'}
            active={Boolean(tokenInput)}
          />
        </div>
      </header>

      {showSkills && manifest ? (
        <div className="z-10 border-b border-slate-200/40 bg-white/60 backdrop-blur px-8 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400">Skills:</span>
            {availableSkills.length === 0 ? <span className="text-xs text-slate-400">（无可用）</span> : null}
            {availableSkills.map((name) => {
              const on = manifest.skills.includes(name)
              return (
                <button
                  key={name}
                  onClick={() => onSkillToggle(name)}
                  className={
                    'rounded-full border px-3 py-1 text-xs transition ' +
                    (on
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50/50')
                  }
                >
                  {on ? '✓ ' : ''}{name}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {showToken ? (
        <div className="z-10 border-b border-slate-200/40 bg-white/60 backdrop-blur px-8 py-3 flex items-center gap-2 text-sm">
          <KeyRound className="w-4 h-4 text-slate-400" />
          <span className="text-xs uppercase tracking-wider text-slate-500">RELAY_TOKEN</span>
          <input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            type="password"
            autoComplete="off"
            placeholder="若后端没设 RELAY_TOKEN 就留空"
            className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-blue-300 focus:outline-none"
          />
          <button onClick={saveToken} className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">
            <Check className="w-3 h-3" /> 存
          </button>
        </div>
      ) : null}
    </>
  )
}

function HeaderButton({ onClick, icon: Icon, label, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'flex items-center space-x-2 text-xs uppercase tracking-wider transition-colors p-2 ' +
        (disabled
          ? 'text-slate-300 cursor-not-allowed'
          : active
            ? 'text-blue-600 hover:text-blue-700'
            : 'text-slate-500 hover:text-blue-600')
      }
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-slate-200"></div>
}

function ModelColumn({ side, name, accent, colRef, turns, isStreaming, streamingText, emptyHint, relayLabel, onRelay, relayDisabled }) {
  const borderSide = side === 'left' ? 'border-r' : 'border-l'
  const headerBg = accent === 'indigo' ? 'bg-indigo-50/30' : 'bg-sky-50/30'
  const headerText = accent === 'indigo' ? 'text-indigo-600' : 'text-sky-600'
  const accentHover = accent === 'indigo'
    ? 'hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50'
    : 'hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'

  return (
    <section className={`w-1/3 ${borderSide} border-slate-200/60 bg-white/80 backdrop-blur-sm flex flex-col relative`}>
      <div className={`px-6 py-4 border-b border-slate-100 ${headerBg} flex justify-between items-center`}>
        <span className={`text-xs uppercase tracking-widest font-medium ${headerText}`}>{name}</span>
        {isStreaming ? <span className={`text-[10px] uppercase ${headerText} animate-pulse`}>Receiving...</span> : null}
      </div>
      <div ref={colRef} className="scrollbar-thin flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm leading-relaxed font-light text-slate-600">
        {turns.length === 0 && !isStreaming ? (
          <div className="mt-12 text-center text-xs text-slate-400">{emptyHint}</div>
        ) : null}
        {turns.map((t) => <TurnCard key={`${t.role}-${t.index}`} turn={t} />)}
        {isStreaming ? (
          <div className="rounded-lg border border-slate-100 bg-white/60 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> streaming
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 streaming-cursor">{streamingText}</pre>
          </div>
        ) : null}
      </div>
      <div className="p-4 border-t border-slate-100 bg-white/50 flex justify-center">
        <button
          onClick={onRelay}
          disabled={relayDisabled}
          className={
            'flex items-center space-x-2 text-xs uppercase tracking-wider text-slate-500 transition-all py-2 px-6 border border-slate-200 rounded-full hover:shadow-sm bg-white ' +
            (relayDisabled ? 'opacity-40 cursor-not-allowed' : accentHover)
          }
        >
          {side === 'left' ? (
            <>
              <span>{relayLabel}</span>
              <ArrowLeftRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-3 h-3" />
              <span>{relayLabel}</span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}

function TurnCard({ turn }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white/60 p-4">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <span>turn {turn.index}</span>
        <span>·</span>
        <span>{ROLE_LABEL[turn.role] || turn.role}</span>
        {turn.tokens ? <><span>·</span><span>{turn.tokens} tok</span></> : null}
      </div>
      {turn.attachments?.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {turn.attachments.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
              <Paperclip className="w-3 h-3 opacity-60 text-blue-500" />{a.name}
            </span>
          ))}
        </div>
      ) : null}
      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{turn.content}</pre>
    </div>
  )
}

function DirectorCanvas({ userTurns, input, setInput, attachments, removeAttachment, isDragging, onDragOver, onDragLeave, onDrop, busy, canSend, hasInput, onSendClaude, onSendGpt }) {
  return (
    <section className="w-1/3 flex flex-col bg-transparent">
      <div className="px-6 py-4 border-b border-slate-200/60 flex justify-center items-center bg-white/40 backdrop-blur-md">
        <span className="text-xs uppercase tracking-widest font-medium text-slate-500">Director Canvas</span>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-6 space-y-3">
        {userTurns.length === 0 ? (
          <div className="mt-12 text-center text-xs text-slate-400">
            还没发过话。下面写指令、拖文件，按 "To Claude" 或 "To GPT"。
          </div>
        ) : null}
        {userTurns.map((t) => <TurnCard key={`u-${t.index}`} turn={t} />)}
      </div>

      <div className="p-6 pt-3">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={
            'flex flex-col border rounded-xl bg-white/90 backdrop-blur-xl shadow-sm transition-all duration-300 ' +
            (isDragging
              ? 'border-blue-400 ring-4 ring-blue-50 shadow-md'
              : 'border-slate-200 hover:border-blue-200 hover:shadow-md')
          }
        >
          {attachments.length > 0 ? (
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2 bg-slate-50/50 rounded-t-xl">
              {attachments.map((att) => (
                <span key={att.id} className="inline-flex items-center px-2 py-1 bg-white text-slate-600 text-[10px] uppercase tracking-wider rounded border border-slate-200 shadow-sm">
                  <Paperclip className="w-3 h-3 mr-1 opacity-60 text-blue-500" />
                  {att.name}
                  <button onClick={() => removeAttachment(att.id)} className="ml-2 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <textarea
            className="w-full min-h-[120px] p-5 bg-transparent resize-none focus:outline-none text-sm font-light text-slate-700 placeholder:text-slate-400 leading-relaxed disabled:opacity-60"
            placeholder={canSend ? 'Draft your instruction... (拖文件 / 图片到这里)' : '先建一个 session'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!canSend}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                onSendClaude()
              }
            }}
          />
        </div>

        <div className="flex justify-between mt-4 gap-3">
          <button
            onClick={onSendClaude}
            disabled={!canSend || !hasInput}
            className="group flex-1 flex items-center justify-center space-x-2 py-3 bg-white border border-slate-200 hover:border-indigo-200 text-xs uppercase tracking-widest text-indigo-600 transition-all rounded-xl hover:shadow-sm hover:bg-indigo-50/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white"
          >
            <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            <span>To Claude</span>
          </button>
          <button
            onClick={onSendGpt}
            disabled={!canSend || !hasInput}
            className="group flex-1 flex items-center justify-center space-x-2 py-3 bg-white border border-slate-200 hover:border-sky-200 text-xs uppercase tracking-widest text-sky-600 transition-all rounded-xl hover:shadow-sm hover:bg-sky-50/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white"
          >
            <span>To GPT</span>
            <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>⌘/Ctrl + Enter → Claude</span>
          {busy ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 上传中</span> : null}
        </div>
      </div>
    </section>
  )
}
