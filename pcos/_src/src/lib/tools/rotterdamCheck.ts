import { rotterdam } from '@/lib/pcos';

export function rotterdamCheck(features: {
  oligoAnovulation: boolean;
  clinicalHA: boolean;
  biochemicalHA: boolean;
  pcom: boolean;
}) {
  return rotterdam(features);
}
