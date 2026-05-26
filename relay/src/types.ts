export type Role = 'user' | 'claude' | 'gpt' | 'system';

export type ProviderTarget = 'claude' | 'gpt';

export type AttachmentKind = 'image' | 'text' | 'pdf' | 'other';

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  path: string;
  kind: AttachmentKind;
};

export type Turn = {
  index: number;
  role: Role;
  content: string;
  attachments: Attachment[];
  createdAt: string;
  tokens?: number;
  model?: string;
};

export type SessionManifest = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  turnCount: number;
  compactedThrough: number;
  skills: string[];
};
