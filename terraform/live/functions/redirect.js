function handler(event) {
    var request = event.request;
    if (request.uri.match(/\/starknet[a-z]*[0-9]{0,9}[\/]{0,1}$/)) { request.uri = request.uri.replace(/\/starknet.*/,'/starknet/index.html'); }
    return request;
}
