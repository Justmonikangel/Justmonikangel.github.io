import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { readProviderKey, removeItem, writeProviderKey } from '@/lib/storage';
import { useSettings, PROVIDER_LABELS, PROVIDER_MODELS, type ProviderId } from '@/store/settings';
import { useReports } from '@/store/reports';
import { useStories } from '@/store/stories';
import { useUser } from '@/store/user';
import { useCare } from '@/store/care';
import { useSelfAssessment } from '@/store/selfAssessment';
import { useUiStore } from '@/store/ui';

type TestStatus = 'idle' | 'pending' | 'ok' | 'fail';

export default function Settings() {
  const provider = useSettings((s) => s.provider);
  const model = useSettings((s) => s.model);
  const proxyUrl = useSettings((s) => s.proxyUrl);
  const inviteCode = useSettings((s) => s.inviteCode);
  const saveOriginalImages = useSettings((s) => s.saveOriginalImages);
  const setProvider = useSettings((s) => s.setProvider);
  const setModel = useSettings((s) => s.setModel);
  const setProxyUrl = useSettings((s) => s.setProxyUrl);
  const setInviteCode = useSettings((s) => s.setInviteCode);
  const setSaveOriginalImages = useSettings((s) => s.setSaveOriginalImages);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [clearConfirmed, setClearConfirmed] = useState(false);

  useEffect(() => {
    const existing = readProviderKey(provider);
    if (existing) {
      setApiKeyInput(existing);
      setKeySaved(true);
    } else {
      setApiKeyInput('');
      setKeySaved(false);
    }
    setTestStatus('idle');
  }, [provider]);

  const handleProviderChange = (next: ProviderId) => {
    setProvider(next);
  };

  const handleSaveKey = () => {
    writeProviderKey(provider, apiKeyInput.trim());
    setKeySaved(true);
    setTestStatus('idle');
  };

  const handleClearKey = () => {
    removeItem(`cyster.provider-key.${provider}`);
    setApiKeyInput('');
    setKeySaved(false);
    setTestStatus('idle');
  };

  const handleTestConnectivity = async () => {
    setTestStatus('pending');
    // P1.5: this will actually round-trip a lightweight LLM call. For now we
    // just check that we have a key + (optional) proxy URL looks like a URL.
    await new Promise((r) => setTimeout(r, 600));
    const looksOk =
      keySaved &&
      (!proxyUrl ||
        proxyUrl.startsWith('http://') ||
        proxyUrl.startsWith('https://'));
    setTestStatus(looksOk ? 'ok' : 'fail');
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: useUser.getState().profile,
      reports: useReports.getState().list,
      stories: useStories.getState().resonatedIds,
      care: useCare.getState().notes,
      selfAssessmentSessions: useSelfAssessment.getState().sessions,
      ui: { theme: useUiStore.getState().theme },
      settings: useSettings.getState(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyster-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (typeof window === 'undefined') return;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith('cyster.'))
      .forEach((k) => window.localStorage.removeItem(k));
    setClearConfirmed(false);
    window.location.reload();
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">设置</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          Provider / Model / 数据
        </h1>
        <p className="text-sm leading-7 text-cy-ink-2">
          P1 阶段 Cyster 没有后端：你需要自带 LLM provider 的 API key 才能使用 Agent。
          所有 key 仅本地保存（base64 + XOR 简单混淆），不会上传到任何地方。
          P1.5 会接通 Cloudflare Worker 代理 + 邀请码模式，那时不需要自带 key。
        </p>
      </header>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">LLM Provider</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="text-cy-ink-2">Provider</span>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
              className="block h-11 w-full rounded-2xl border border-cy-line bg-white/80 px-3 text-sm text-cy-ink-1"
            >
              {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-cy-ink-2">Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="block h-11 w-full rounded-2xl border border-cy-line bg-white/80 px-3 text-sm text-cy-ink-1"
            >
              {PROVIDER_MODELS[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-1.5 text-sm">
          <span className="text-cy-ink-2">API Key</span>
          <div className="flex gap-2">
            <Input
              type={keyVisible ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="粘贴你的 API key（仅保存在本地）"
              autoComplete="off"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setKeyVisible((v) => !v)}>
              {keyVisible ? '隐藏' : '显示'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button type="button" size="sm" onClick={handleSaveKey} disabled={!apiKeyInput.trim()}>
              保存
            </Button>
            {keySaved ? (
              <Button type="button" size="sm" variant="ghost" onClick={handleClearKey}>
                清除此 provider 的 key
              </Button>
            ) : null}
            <span className="text-cy-ink-3">
              {keySaved ? `已保存（${PROVIDER_LABELS[provider]}）` : '尚未保存'}
            </span>
          </div>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-cy-ink-2">Proxy URL（可选）</span>
          <Input
            type="url"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="https://your-worker.example.workers.dev"
          />
          <span className="block text-xs text-cy-ink-3">
            国内访问境外 provider 时填这里；留空表示直连。
          </span>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-cy-ink-2">Invite Code（P1.5 启用）</span>
          <Input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="P1.5 邀请制 beta 才会启用"
            disabled
          />
        </label>

        <div className="flex items-center gap-3">
          <Button type="button" size="sm" variant="secondary" onClick={handleTestConnectivity}>
            测试连通性
          </Button>
          <span className="text-xs">
            {testStatus === 'idle' && <span className="text-cy-ink-3">尚未测试</span>}
            {testStatus === 'pending' && <span className="text-cy-ink-3">测试中…</span>}
            {testStatus === 'ok' && <span style={{ color: 'var(--cy-success)' }}>✓ 看起来 OK（P1.5 接通真实请求后会做实际探测）</span>}
            {testStatus === 'fail' && <span style={{ color: 'var(--cy-danger)' }}>× key 缺失或 proxy URL 格式错误</span>}
          </span>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">数据</h2>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-cy-line text-cy-primary focus:ring-cy-primary"
            checked={saveOriginalImages}
            onChange={(e) => setSaveOriginalImages(e.target.checked)}
          />
          <span>
            <span className="block text-cy-ink-1">保留报告原图</span>
            <span className="block text-xs text-cy-ink-3">
              默认 OCR 完成后只保留结构化结果。勾选后原图存到本机 IndexedDB（不上传）。
            </span>
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
            导出本地数据
          </Button>
          {clearConfirmed ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleClearAll}
                style={{ backgroundColor: 'var(--cy-danger)' }}
              >
                确认清空所有本地数据
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setClearConfirmed(false)}
              >
                取消
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setClearConfirmed(true)}
            >
              清空所有本地数据…
            </Button>
          )}
        </div>
      </Card>

      <p className="text-xs leading-5 text-cy-ink-3">
        Cyster 不会在你不知情的情况下访问网络。所有 LLM 请求都使用你在上面填写的 provider + key（或 proxy）。
        如果你在生产环境使用，请考虑用受限权限的 API key。
      </p>
    </div>
  );
}
