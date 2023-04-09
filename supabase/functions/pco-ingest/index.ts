// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Future-me problems:
// TODO: PCO might return multiple people with matching email addresses.

serve(async (req) => {
    const { type, time, data } = await req.json()
    const user = data['user'];
    const field_definition_id = '632202';
    
    let date = new Date(time);
    
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedDate = mm + '/' + dd + '/' + yyyy;

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
    let url = 'https://api.planningcenteronline.com/people/v2/people?where[search_name_or_email]='+user['email'];

    // Query PCO By Person:
    const response = await fetch(url, {
        method:'GET',
        headers: {
            Authorization: 'Basic '+btoa(Deno.env.get('PCO_APP_ID')+':'+Deno.env.get('PCO_APP_SECRET'))
        },
    });
    const pcoResp = await response.json();
    
    let message = '';
    
    // If PCO returned at least one person.
    if (pcoResp['data'].length) {
        message = 'Person found with email: '+user['email']

//        const person = pcoResp['data'][0];
//        
//        url = 'https://api.planningcenteronline.com/people//v2/people/'+person['id']+'/field_data';
//        
//        console.log(formattedDate);
        
//        const response = await fetch(url, {
//            method:'POST',
//            headers: {
//                Authorization: 'Basic '+btoa(Deno.env.get('PCO_APP_ID')+':'+Deno.env.get('PCO_APP_SECRET'))
//            },
//            body: JSON.stringify({
//                "data": {
//                    "attributes": {
//                        "field_definition_id": field_definition_id,
//                        "value": formattedDate
//                    }
//                }
//            }),
//        });

        
        // Person is found. 
        // TODO: Update user.
    } else {
        message = 'Person not found with email: '+user['email']
        // Person not with / email. 
        // TODO: search by name (or other factor)?
        // TODO: Create new person if still not found.
    }

    return new Response(
        JSON.stringify({
                status: 200,
                message: message
            }),
        { headers: { "Content-Type": "application/json" } },
    )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
