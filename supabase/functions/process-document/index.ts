import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Configuration, OpenAIApi } from 'npm:openai@4.24.1';
import { encode, decode } from 'npm:gpt-tokenizer@2.1.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }));

    const { document }: { document: { id: string, content: string, title: string } } = await req.json();

    const chunks = splitIntoChunks(document.content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const { data: embedding } = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: chunk,
      });

      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: document.id,
          content: chunk,
          embedding: embedding.data[0].embedding,
          chunk_index: i,
        });

      if (error) throw error;
    }

    return new Response(JSON.stringify({ message: 'Document processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
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
