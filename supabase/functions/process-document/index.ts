import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { encode, decode } from 'npm:gpt-tokenizer@2.1.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, x-client-info, apikey, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const gemini = new GoogleGenerativeAI(Deno.env.get('EXPO_PUBLIC_GEMINI_API_KEY') ?? '');
    const model = gemini.getGenerativeModel({ model: 'gemini-pro' });

    const { document } = await req.json();
    const chunks = splitIntoChunks(document.content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const result = await model.generateContent(`Summarize the following chunk:\n\n${chunk}`);
      const response = await result.response;
      const summary = response.text();

      const { error } = await supabaseClient.from('document_chunks').insert({
        document_id: document.id,
        content: chunk,
        summary: summary,
        chunk_index: i,
      });

      if (error) throw error;
    }

    return new Response(JSON.stringify({ message: 'Document processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function splitIntoChunks(text: string, maxTokens = 500): string[] {
  const tokens = encode(text);
  const chunks: string[] = [];
  let currentChunk: number[] = [];

  for (const token of tokens) {
    if (currentChunk.length >= maxTokens) {
      chunks.push(decode(currentChunk));
      currentChunk = [];
    }
    currentChunk.push(token);
  }

  if (currentChunk.length > 0) {
    chunks.push(decode(currentChunk));
  }

  return chunks;
}
