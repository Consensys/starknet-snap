function handler(event) {
    var request = event.request;
    if (request.uri.match(/\/starknet.*/)) { request.uri = request.uri.replace(/\/starknet.*/,'/starknet/index.html'); }
    return request;
}
