'use strict';
exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;
    
    
    headers['x-frame-options'] = [{
        key:   'X-Frame-Options',
        value: "SAMEORIGIN"
    }];
    

    callback(null, response);
};