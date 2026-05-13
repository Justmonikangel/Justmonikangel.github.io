import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import doctorsSeed from '@/mocks/doctors.json';
import type { Doctor } from '@/types/doctor';

interface DoctorsState {
  doctors: Doctor[];
}

export const useDoctors = create<DoctorsState>()(
  persist(
    () => ({
      doctors: doctorsSeed as Doctor[],
    }),
    { name: 'cyster.doctors.v1' },
  ),
);
