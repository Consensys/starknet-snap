function handler(event) {
    var response = event.response;
    var headers = response.headers;

    headers['x-frame-options'] = {value: 'SAMEORIGIN'}; 
    
    return response;
}
