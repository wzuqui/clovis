'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import PostForm from '@/components/PostForm';
import Timeline from '@/components/Timeline';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineKey, setTimelineKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Header user={user} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white leading-tight">
            O que o Clóvis Code fez pra te{' '}
            <span className="text-purple-400">surpreender</span> hoje?
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Experiências boas, ruins, inusitadas — todas são bem-vindas.
          </p>
        </div>

        {user ? (
          <PostForm onSuccess={() => setTimelineKey((k) => k + 1)} />
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center mb-8">
            <p className="text-gray-300 mb-4">
              Entre para compartilhar sua experiência com o Claude Code
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Entrar
            </a>
          </div>
        )}

        <Timeline key={timelineKey} currentUserId={user?.id} />
      </div>
    </main>
  );
}
