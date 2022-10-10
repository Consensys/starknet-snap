function handler(event) {
    var request = event.request;
        if (request.uri == "/starknet" || request.uri == "/starknet/") { request.uri = request.uri.replace(/.*starknet.*/,'/starknet/index.html'); }
        return request;
}
