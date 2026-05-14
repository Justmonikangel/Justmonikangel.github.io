import { AlertTriangle, Phone } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EMERGENCY_CONTACTS_CN } from '@/lib/safety/escalation';
import type { CompiledRedFlag } from '@/lib/safety/redFlags';

interface EmergencyCardProps {
  match: CompiledRedFlag;
}

/**
 * Rendered when lib/safety/detect flags user input. Renders inline in the
 * chat stream (instead of an LLM response) and on any route that detected
 * a red flag via input.
 */
export function EmergencyCard({ match }: EmergencyCardProps) {
  return (
    <Card className="cy-emergency space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: 'var(--cy-safety)' }} />
        <div>
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cy-safety)' }}>
            请立即寻求专业帮助
          </h2>
          <p className="mt-2 text-sm leading-6 text-cy-ink-2">{match.emergencyMessage}</p>
        </div>
      </div>

      <ul className="space-y-2 text-sm leading-6 text-cy-ink-1">
        {EMERGENCY_CONTACTS_CN.map((c) => (
          <li key={c.label} className="flex items-baseline gap-3">
            <Phone className="h-4 w-4 flex-shrink-0 text-cy-ink-3" />
            <div>
              <span className="font-medium">{c.label}</span>
              {c.phone ? <span className="ml-2 font-mono tabular-nums">{c.phone}</span> : null}
              <span className="ml-2 text-cy-ink-3">— {c.description}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-5 text-cy-ink-3">
        Cyster 不替代急诊或心理危机干预。这条提示因检测到关键词 "{match.id}" 触发。
      </p>
    </Card>
  );
}
