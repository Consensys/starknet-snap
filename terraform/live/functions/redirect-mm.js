function handler(event) {
    var request = event.request;
    
        if (request.uri == "/starknet" || request.uri == "/starknet/") { 
            request.uri = request.uri.replace(/.*starknet.*/,'/starknet/index.html'); 
            return request;
        }
        if (request.uri.startsWith("/starknet")) { 
            return request;
        }
        return {
            statusCode: 302,
            statusDescription: 'Moved Temporarily',
            headers: {
                'location': { "value": `https://metamask.io/snaps` }
            }
        };
}
