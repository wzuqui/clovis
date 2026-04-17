import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const PROMPT = `Classifique o sentimento do texto abaixo como exatamente uma palavra: "positive", "neutral" ou "negative". Responda apenas com a palavra, sem pontuação.`;

async function classify(openai: OpenAI, text: string): Promise<string> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: text.slice(0, 1000) },
      ],
      max_tokens: 5,
      temperature: 0,
    });
    const raw = res.choices[0]?.message?.content?.trim().toLowerCase() ?? '';
    return ['positive', 'neutral', 'negative'].includes(raw) ? raw : 'neutral';
  } catch {
    return 'neutral';
  }
}

export async function POST() {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: posts }, { data: comments }] = await Promise.all([
      supabase.from('posts').select('id, content').is('sentiment', null),
      supabase.from('comments').select('id, content').is('sentiment', null),
    ]);

    let processed = 0;
    for (const post of posts ?? []) {
      const sentiment = await classify(openai, post.content);
      await supabase.from('posts').update({ sentiment }).eq('id', post.id);
      processed++;
    }
    for (const comment of comments ?? []) {
      const sentiment = await classify(openai, comment.content);
      await supabase.from('comments').update({ sentiment }).eq('id', comment.id);
      processed++;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
