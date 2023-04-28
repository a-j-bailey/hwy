import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Future-me problems:
// TODO: PCO might return multiple people with matching email addresses?
// TODO: If the person doesn't exist. Should we add them?
// TODO: Integrate with LogSnag

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

    console.log('Event: ' + type + ' @ ' + time);
    
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
        message = 'Person found with email: '+user['email'];

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
            console.log('Field not found');
        }
    } else {
        message = 'Person not found with email: '+user['email']
        // Person not with / email. 
        // TODO: search by name (or other factor)?
        // TODO: Create new person if still not found.
    }

    return new Response(
        JSON.stringify({
                status: status,
                message: message
            }),
        { headers: { "Content-Type": "application/json" } },
    )
})