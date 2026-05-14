import type { Citation } from '@/types/common';

/**
 * Render a Citation as a single line "text — URL/PMID/DOI" for inline
 * display. UI components consume this directly or build richer markup.
 */
export function formatCitation(c: Citation): string {
  const parts = [c.text];
  if (c.pmid) parts.push(`PMID ${c.pmid}`);
  if (c.doi) parts.push(`DOI ${c.doi}`);
  if (c.url) parts.push(c.url);
  return parts.join(' — ');
}

/**
 * Resolve the canonical link for a citation. Prefers PubMed for PMID,
 * doi.org for DOI, otherwise the raw URL.
 */
export function citationHref(c: Citation): string | undefined {
  if (c.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`;
  if (c.doi) return `https://doi.org/${c.doi}`;
  return c.url;
}
