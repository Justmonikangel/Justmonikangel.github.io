import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCare } from '@/store/care';
import type {
  CareNote,
  DoctorPrepItem,
  PrescribedMedication,
} from '@/types/care';

const DEFAULT_PREP_TEMPLATE: Array<Omit<DoctorPrepItem, 'id' | 'done'>> = [
  { text: '症状清单：月经周期 / 痤疮 / 多毛 / 体重 / 情绪', category: 'symptoms' },
  { text: '近期生活变化：作息 / 压力 / 饮食 / 运动', category: 'lifestyle' },
  { text: '既往就诊记录与既往用药', category: 'history' },
  { text: '当前在服的药物或营养补充剂', category: 'medications' },
  { text: '想问医生的问题（写下来再去）', category: 'questions' },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const KIND_LABELS: Record<CareNote['kind'], string> = {
  'doctor-prep': '看医生准备',
  'visit-log': '复诊记录',
  'medication-log': '药物记录',
  'follow-up': '复查提醒',
};

export default function Care() {
  const notes = useCare((s) => s.notes);
  const addNote = useCare((s) => s.addNote);
  const updateNote = useCare((s) => s.updateNote);
  const removeNote = useCare((s) => s.removeNote);

  const prepNotes = notes.filter((n) => n.kind === 'doctor-prep');
  const medNotes = notes.filter((n) => n.kind === 'medication-log');

  const handleCreatePrep = () => {
    const now = new Date().toISOString();
    const note: CareNote = {
      id: uid('care-prep'),
      createdAt: now,
      updatedAt: now,
      kind: 'doctor-prep',
      doctorPrepChecklist: DEFAULT_PREP_TEMPLATE.map((t) => ({
        ...t,
        id: uid('prep-item'),
        done: false,
      })),
      questionsForNextVisit: [],
    };
    addNote(note);
  };

  const handleCreateMedLog = () => {
    const now = new Date().toISOString();
    const note: CareNote = {
      id: uid('care-med'),
      createdAt: now,
      updatedAt: now,
      kind: 'medication-log',
      prescribed: [],
    };
    addNote(note);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          看医生准备
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          带着清单去看医生
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-cy-ink-2">
          Cyster 不开处方、不调剂量。这里只是帮你把要说的、要问的、医生开的、复诊提醒，
          整理在一个地方。所有内容仅保存在你的浏览器。
        </p>
      </header>

      <Card className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">就诊前清单</h2>
          <Button type="button" size="sm" variant="secondary" onClick={handleCreatePrep}>
            新建一份
          </Button>
        </div>

        {prepNotes.length === 0 ? (
          <p className="text-sm text-cy-ink-3">还没有清单。点击「新建一份」会创建一个默认模板。</p>
        ) : (
          <div className="space-y-4">
            {prepNotes.map((note) => (
              <PrepNoteEditor
                key={note.id}
                note={note}
                onChange={(patch) => updateNote(note.id, patch)}
                onRemove={() => removeNote(note.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">医生已开药记录</h2>
          <Button type="button" size="sm" variant="secondary" onClick={handleCreateMedLog}>
            新建一份
          </Button>
        </div>

        <p className="text-xs text-cy-ink-3">
          这里只记录医生面诊后真实开的药——剂量和频率请按处方填写。AI 不会修改这些字段，
          也不会推荐你换药或调整剂量。
        </p>

        {medNotes.length === 0 ? (
          <p className="text-sm text-cy-ink-3">还没有药物记录。</p>
        ) : (
          <div className="space-y-4">
            {medNotes.map((note) => (
              <MedicationLogEditor
                key={note.id}
                note={note}
                onChange={(patch) => updateNote(note.id, patch)}
                onRemove={() => removeNote(note.id)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PrepNoteEditor({
  note,
  onChange,
  onRemove,
}: {
  note: CareNote;
  onChange: (patch: Partial<CareNote>) => void;
  onRemove: () => void;
}) {
  const checklist = note.doctorPrepChecklist ?? [];
  const questions = note.questionsForNextVisit ?? [];

  const toggleItem = (id: string) => {
    onChange({
      doctorPrepChecklist: checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    });
  };

  const addQuestion = (text: string) => {
    if (!text.trim()) return;
    onChange({ questionsForNextVisit: [...questions, text.trim()] });
  };

  const removeQuestion = (idx: number) => {
    onChange({ questionsForNextVisit: questions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3 rounded-2xl bg-white/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-cy-ink-3">
          创建于 {note.createdAt.slice(0, 10)} · {KIND_LABELS[note.kind]}
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          删除
        </Button>
      </div>

      <ul className="space-y-2 text-sm">
        {checklist.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-cy-line text-cy-primary focus:ring-cy-primary"
              checked={item.done}
              onChange={() => toggleItem(item.id)}
            />
            <span className={item.done ? 'text-cy-ink-3 line-through' : 'text-cy-ink-1'}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>

      <div>
        <p className="text-xs font-medium text-cy-ink-3">想问医生的问题</p>
        {questions.length === 0 ? (
          <p className="mt-1 text-xs text-cy-ink-3">尚未添加问题。</p>
        ) : (
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-cy-ink-1">
            {questions.map((q, i) => (
              <li key={i} className="flex items-start justify-between gap-2">
                <span>{q}</span>
                <button
                  type="button"
                  className="text-xs text-cy-ink-3 hover:text-cy-danger"
                  onClick={() => removeQuestion(i)}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
        <AddQuestionRow onAdd={addQuestion} />
      </div>
    </div>
  );
}

function AddQuestionRow({ onAdd }: { onAdd: (text: string) => void }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="mt-2 flex gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="例如：我需不需要复查 TSH？"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onAdd(draft);
            setDraft('');
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => {
          onAdd(draft);
          setDraft('');
        }}
      >
        添加
      </Button>
    </div>
  );
}

function MedicationLogEditor({
  note,
  onChange,
  onRemove,
}: {
  note: CareNote;
  onChange: (patch: Partial<CareNote>) => void;
  onRemove: () => void;
}) {
  const prescribed = note.prescribed ?? [];

  const handleAdd = (entry: PrescribedMedication) => {
    onChange({ prescribed: [...prescribed, entry] });
  };

  const handleRemove = (id: string) => {
    onChange({ prescribed: prescribed.filter((m) => m.id !== id) });
  };

  return (
    <div className="space-y-3 rounded-2xl bg-white/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-cy-ink-3">
          创建于 {note.createdAt.slice(0, 10)} · 共 {prescribed.length} 条
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          删除整份
        </Button>
      </div>

      {prescribed.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {prescribed.map((m) => (
            <li key={m.id} className="rounded-xl bg-white/80 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-cy-ink-1">{m.drug}</span>
                <button
                  type="button"
                  className="text-xs text-cy-ink-3 hover:text-cy-danger"
                  onClick={() => handleRemove(m.id)}
                >
                  删除
                </button>
              </div>
              <p className="mt-0.5 text-xs text-cy-ink-3">
                {m.dose} · {m.frequency}
                {m.startDate ? ` · 起 ${m.startDate}` : ''}
                {m.prescribedBy ? ` · 处方人 ${m.prescribedBy}` : ''}
              </p>
              {m.notes ? <p className="mt-1 text-xs text-cy-ink-2">{m.notes}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <AddMedicationRow onAdd={handleAdd} />
    </div>
  );
}

function AddMedicationRow({ onAdd }: { onAdd: (entry: PrescribedMedication) => void }) {
  const [drug, setDrug] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  const canAdd = drug.trim().length > 0;

  const handleSubmit = () => {
    if (!canAdd) return;
    onAdd({
      id: uid('med'),
      drug: drug.trim(),
      dose: dose.trim(),
      frequency: frequency.trim(),
      prescribedBy: prescribedBy.trim(),
      startDate: startDate || new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
      log: [],
    });
    setDrug('');
    setDose('');
    setFrequency('');
    setPrescribedBy('');
    setStartDate('');
    setNotes('');
  };

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-cy-line/80 bg-white/40 p-3 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={drug} onChange={(e) => setDrug(e.target.value)} placeholder="药物名 (如 二甲双胍)" />
        <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="剂量 (如 500 mg)" />
        <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="频率 (如 一日两次餐后)" />
        <Input value={prescribedBy} onChange={(e) => setPrescribedBy(e.target.value)} placeholder="处方医生 (如 王医生)" />
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="备注 (可选)" />
      </div>
      <Button type="button" size="sm" disabled={!canAdd} onClick={handleSubmit}>
        添加这条处方
      </Button>
      <p className="text-xs text-cy-ink-3">
        剂量、频率、用药时长全部按医生处方填写。Cyster 永远不会建议你更改这些字段。
      </p>
    </div>
  );
}
