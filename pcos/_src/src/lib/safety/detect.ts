import { listRedFlagPatterns, type CompiledRedFlag } from '@/lib/safety/redFlags';

/**
 * Detect any red-flag match in user input. R-5: false-positive bias is
 * preferred over false-negative; one match is enough to halt the agent loop.
 *
 * Returns the first match found. Caller (agent loop) renders the
 * EmergencyCard and pushes a SafetyEvent into useSafety store.
 */
export function detectRedFlag(userInput: string): CompiledRedFlag | null {
  if (!userInput) return null;
  for (const pattern of listRedFlagPatterns()) {
    if (pattern.regex.test(userInput)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Convenience: list every match (used for tests + Settings debug view).
 */
export function detectAllRedFlags(userInput: string): CompiledRedFlag[] {
  if (!userInput) return [];
  return listRedFlagPatterns().filter((p) => p.regex.test(userInput));
}
