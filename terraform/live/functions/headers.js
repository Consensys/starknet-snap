function handler(event) {
    var response = event.response;
    var headers = response.headers;

    try {
        var request = event.request;
        // if the request is for the get-starknet, add header to allow cross-origin requests
        if (request.uri.includes("starknet/get-starknet/v1")) { 
            headers["access-control-allow-origin"] = { value: "*" };
            headers["access-control-allow-methods"] = { value: "GET, HEAD" };
        }
    } catch (e) {
        // output errors to the console
        console.log(e);
    }

    
    headers['x-frame-options'] = {value: 'SAMEORIGIN'}; 

    return response;
}
