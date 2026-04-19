import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { text, post_id, comment_id, mentioned_by_user_id } = await req.json();
    if (!text || !mentioned_by_user_id) return NextResponse.json({ ok: true });

    const rawNames = text.match(/@(\w+)/g);
    if (!rawNames || rawNames.length === 0) return NextResponse.json({ ok: true });

    const names = Array.from(new Set(rawNames.map((n: string) => n.slice(1))));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('name', names);

    if (!profiles || profiles.length === 0) return NextResponse.json({ ok: true });

    const rows = profiles
      .filter(p => p.id !== mentioned_by_user_id)
      .map(p => ({
        mentioned_user_id: p.id,
        mentioned_by_user_id,
        ...(post_id ? { post_id } : {}),
        ...(comment_id ? { comment_id } : {}),
      }));

    if (rows.length > 0) {
      await supabase.from('mentions').insert(rows);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
