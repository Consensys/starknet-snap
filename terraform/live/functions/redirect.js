function handler(event) {
    var request = event.request;
    var uri = request.uri
    if (uri.match(/\/starknet.*/)) { request.uri = request.uri.replace(/\/starknet.*/,'/starknet/index.html'); }
    return request;
}
