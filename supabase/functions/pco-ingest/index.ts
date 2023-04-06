// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { data } = await req.json()
  const user = data.user;
  const event = null;
  
  // Makes sure the info I need exists.
  if (!user) {
    return new Response(
      JSON.stringify({
        status: 400,
        message: 'User object not found in request.'
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  }￼

  // TODO: connect to PCO API.

  // TODO: fetch user from PCO API.

  // TODO: Update user via PCO API.

  return new Response(
    JSON.stringify(user),
    { headers: { "Content-Type": "application/json" } },
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
