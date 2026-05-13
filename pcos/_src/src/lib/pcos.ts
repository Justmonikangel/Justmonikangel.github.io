import type { DiagnosisResult } from '@/types/report';

export function rotterdam(features: {
  oligoAnovulation: boolean;
  clinicalHA: boolean;
  biochemicalHA: boolean;
  pcom: boolean;
}): DiagnosisResult {
  const hyperandrogenism = features.clinicalHA || features.biochemicalHA;
  const positives = [features.oligoAnovulation, hyperandrogenism, features.pcom].filter(Boolean).length;
  const meets = positives >= 2;

  let phenotype: 'A' | 'B' | 'C' | 'D' | undefined;

  if (meets) {
    if (features.oligoAnovulation && hyperandrogenism && features.pcom) phenotype = 'A';
    else if (features.oligoAnovulation && hyperandrogenism) phenotype = 'B';
    else if (hyperandrogenism && features.pcom) phenotype = 'C';
    else if (features.oligoAnovulation && features.pcom) phenotype = 'D';
  }

  return {
    criteria: 'Rotterdam2003',
    features: {
      oligoAnovulation: features.oligoAnovulation,
      hyperandrogenism: {
        clinical: features.clinicalHA,
        biochemical: features.biochemicalHA,
      },
      pcomOnUS: features.pcom,
    },
    meets,
    phenotype,
    confidence: meets ? 0.9 : 0.7,
    rationale: '',
  };
}

export const homaIR = (fastingGlucoseMmolL: number, fastingInsulinUIUmL: number) =>
  (fastingGlucoseMmolL * fastingInsulinUIUmL) / 22.5;

export const bmi = (heightCm: number, weightKg: number) => weightKg / Math.pow(heightCm / 100, 2);
