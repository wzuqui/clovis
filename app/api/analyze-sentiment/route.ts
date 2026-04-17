import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const VALID = ['positive', 'neutral', 'negative', 'excited', 'mixed', 'frustrated', 'angry'];
const PROMPT = `Classifique o sentimento do texto abaixo com exatamente uma palavra em inglês entre as opções: "positive", "neutral", "negative", "excited", "mixed", "frustrated", "angry". Responda apenas com a palavra, sem pontuação.`;

export async function POST(req: NextRequest) {
  try {
    const { text, id, table } = await req.json() as { text: string; id: string; table: 'posts' | 'comments' };
    if (!text || !id || !table) return NextResponse.json({ ok: false }, { status: 400 });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const sentiment = VALID.includes(raw) ? raw : 'neutral';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from(table).update({ sentiment }).eq('id', id);

    return NextResponse.json({ ok: true, sentiment });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
