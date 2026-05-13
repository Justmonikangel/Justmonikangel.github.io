import { homaIR } from '@/lib/pcos';

export function computeHomaIR(fastingGlucoseMmolL: number, fastingInsulinUIUmL: number) {
  return homaIR(fastingGlucoseMmolL, fastingInsulinUIUmL);
}
