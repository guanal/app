import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

console.log('Edge function starting...')

serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "*"
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }
  const { message } = await req.json()

  const reply = `You said: ${message}` 

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  })
})
