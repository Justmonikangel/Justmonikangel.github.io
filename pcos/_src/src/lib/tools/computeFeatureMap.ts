import { pcosFeatureMap, type PcosFeatureMapInput } from '@/lib/pcos';

/**
 * Tool wrapper around `pcosFeatureMap`. Exposes only the pure mapping —
 * upstream agent must have already classified individual features into
 * FeatureFlag shape.
 */
export function computeFeatureMap(input: PcosFeatureMapInput) {
  return pcosFeatureMap(input);
}
