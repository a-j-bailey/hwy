import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Future-me problems:
// TODO: PCO might return multiple people with matching email addresses?
// TODO: If the person doesn't exist. Should we add them?
// TODO: Make smarter to handle different types of events.

serve(async (req) => {
    // INIT data.
    const { type, time, data } = await req.json()
    const user = data['user'];
    const field_definition_id = '632202';
    
    const headers = {
        Authorization: 'Basic '+btoa(Deno.env.get('PCO_APP_ID')+':'+Deno.env.get('PCO_APP_SECRET'))
    };

    let message = '';
    let status = 200;

    let date = new Date(time);
    
    // Parse date.
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedDate = yyyy + '-' + mm + '-' + dd;

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

//    console.log('Event: ' + type + ' @ ' + time);
    
    // Build Query URL:
    let url = 'https://api.planningcenteronline.com/people/v2/people?where[search_name_or_email]='+user['email'];
    
    // Query PCO By Person:
    const response = await fetch(url, {
        method:'GET',
        headers: headers,
    });
    
    let pcoResp = await response.json();
    
    // If PCO returned at least one person.
    if (pcoResp.data.length) {
        // For now we're just using the first person returned.
        const personFields = await fetch(pcoResp.data[0].links.self+'/field_data', {method:'GET', headers: headers,});
        const fields = await personFields.json();
        
        let field = null;
        
        // Check all custom fields on that person looking for Church Online Attendance.
        fields.data.forEach( (fieldDatum) => {
            if (fieldDatum.relationships.field_definition.data.id == '632202') {
                field = fieldDatum;
            }
        })

        // If the field was found.
        if (field) {
            // Update the field with PATCH.
            const update = await fetch(field.links.self, {
                method:'PATCH',
                headers: headers,
                body: JSON.stringify({"data": {"attributes": {"value": formattedDate}}}),
            });
        } else {
            const update = await fetch(pcoResp.data[0].links.self+'/field_data', {
                method:'POST',
                headers: headers,
                body: JSON.stringify({
                    "data": {
                        "attributes": {
                            "field_definition_id": 632202,
                            "value": formattedDate
                        }
                    }
                }),
            });
        }
        message = 'Updated ChurchOnline attendance for '+user['email'];
        
        const update = await fetch('https://api.logsnag.com/v1/log', {
            method:'POST',
            headers: {
                'Authorization': 'Bearer '+Deno.env.get('LOGSNAG_TOKEN'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "project": "church-online",
                "channel": "service-attended",
                "event": "User Attended",
                "description": "email: "+user['email'],
                "icon": "🔥",
                "notify": true,
                "tags": {
                    "email": user['email'],
                }
            }),
        });
    } else {
        message = 'Person not found with email: '+user['nickname']
        // Person not with / email. 
        // TODO: search by name (or other factor)?
        // TODO: Create new person if still not found?
    }

    return new Response(
        JSON.stringify({
                status: status,
                message: message
            }),
        { headers: { "Content-Type": "application/json" } },
    )
})