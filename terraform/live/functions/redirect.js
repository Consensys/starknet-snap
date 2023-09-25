function handler(event) {
    var request = event.request;
    if (request.uri.startsWith("/starknet")) { 
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { "value": request.uri.replace(/.*snaps.consensys.net.*/,'snaps.consensys.io')  }
            }
        };
    }
    return {
        statusCode: 302,
        statusDescription: 'Moved Temporarily',
        headers: {
            'location': { "value": `https://metamask.io/snaps` }
        }
    };
}
