const DRUGS = {
  metformin: {
    drug: 'Metformin',
    note: 'Mock lookup only. Phase P4/P6 can expand this registry.',
  },
};

export function lookupDrug(name: keyof typeof DRUGS) {
  return DRUGS[name] ?? null;
}
