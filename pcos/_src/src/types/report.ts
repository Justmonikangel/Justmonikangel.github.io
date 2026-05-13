export interface Report {
  id: string;
  takenAt: string;
  cycleDay?: number;
  source: 'ocr' | 'manual' | 'imported';
  rawFiles?: string[];
  hormones?: HormonePanel;
  metabolic?: MetabolicPanel;
  ultrasound?: UltrasoundFindings;
  notes?: string;
  parsed: boolean;
  diagnosis?: DiagnosisResult;
}

export interface HormonePanel {
  FSH?: NumValue;
  LH?: NumValue;
  E2?: NumValue;
  P?: NumValue;
  T?: NumValue;
  freeT?: NumValue;
  DHEAS?: NumValue;
  SHBG?: NumValue;
  AMH?: NumValue;
  Prolactin?: NumValue;
  TSH?: NumValue;
  '17OHP'?: NumValue;
}

export interface MetabolicPanel {
  fastingGlucose?: NumValue;
  fastingInsulin?: NumValue;
  HbA1c?: NumValue;
  HOMA_IR?: NumValue;
  TC?: NumValue;
  TG?: NumValue;
  HDL?: NumValue;
  LDL?: NumValue;
  BMI?: NumValue;
  WHR?: NumValue;
}

export interface UltrasoundFindings {
  folliclesPerOvary?: number;
  ovarianVolumeMl?: { left?: number; right?: number };
  endometriumMm?: number;
  description?: string;
}

export interface NumValue {
  value: number;
  unit: string;
  ref?: [number, number];
  flag?: 'low' | 'normal' | 'high';
}

export interface DiagnosisResult {
  criteria: 'Rotterdam2003' | 'AES2009' | 'NIH1990' | 'IntlPCOS2018';
  features: {
    oligoAnovulation: boolean;
    hyperandrogenism: { clinical: boolean; biochemical: boolean };
    pcomOnUS: boolean;
  };
  meets: boolean;
  phenotype?: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  rationale: string;
}
