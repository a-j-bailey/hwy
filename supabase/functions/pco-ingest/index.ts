// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    const { type, time, data } = await req.json()
    const user = data['user'];

    // Makes sure the info I need exists.
    if (!user) {
        return new Response(
            JSON.stringify({
                status: 400,
                message: 'User object not found in request.'
            }),
            { headers: { "Content-Type": "application/json" } },
        )
    }

    console.log('Event: ' + type + ' @ ' + time);
    
    // Build Query URL:
    const url = 'https://api.planningcenteronline.com/people/v2/people?where[search_name_or_email]='+user['email'];

    // Query PCO By Person:
    const response = await fetch(url, {
        method:'GET',
        headers: {
            Authorization: 'Basic '+btoa(Deno.env.get('PCO_APP_ID')+':'+Deno.env.get('PCO_APP_SECRET'))
        },
    });
    const pcoData = await response.json();

    // TODO: Update user via PCO API.

    return new Response(
        JSON.stringify(pcoData),
        { headers: { "Content-Type": "application/json" } },
    )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
