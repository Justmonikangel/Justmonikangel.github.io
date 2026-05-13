import { bmi } from '@/lib/pcos';

export function computeBMI(heightCm: number, weightKg: number) {
  return bmi(heightCm, weightKg);
}
