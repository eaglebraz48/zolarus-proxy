'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RememberRefFromUrl() {
  const sp = useSearchParams();

  useEffect(() => {
    const ref = sp.get('ref');
    if (ref) {
      try {
        localStorage.setItem('zolarus_ref', ref);
      } catch {}
    }
  }, [sp]);

  return null;
}
