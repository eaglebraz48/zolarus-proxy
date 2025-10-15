'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';

type Reminder = {
  id: string;
  title: string | null;
  due_on: string | null;
};

function RemindersContent() {
  const [rows, setRows] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('reminders')
        .select('id, title, due_on')
        .eq('user_id', user.id)
        .order('due_on', { ascending: true });

      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Reminders</h1>
      <p className="text-gray-600 mt-2">Upcoming birthdays & events.</p>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p>Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-600">No reminders yet.</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{r.title ?? 'Unnamed'}</p>
                <p className="text-sm text-gray-600">
                  {r.due_on ? new Date(r.due_on).toDateString() : 'No date'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

export default function RemindersPage() {
  return (
    <Suspense fallback={<div>Loading reminders…</div>}>
      <RemindersContent />
    </Suspense>
  );
}
