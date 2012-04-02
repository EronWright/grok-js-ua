var restler = require('restler'),
    PROXY_PREFIX = '/_grokProxy';

function handleProxyRequest(apiKey, bundle, callback) {
    var url = bundle.endpoint,
        method = bundle.method || 'GET',
        options,
        request;

    options = {
        method: method,
        headers: {
            Authorization: 'Basic ' + new Buffer(apiKey + ':').toString('base64')
        }
    };

    if (bundle.data) {
        if (method === 'GET') {
            options.query = bundle.data;
        } else {
            options.headers['Content-Type'] = 'application/json; charset=UTF-8';
            options.data = JSON.stringify(bundle.data);
        }
    }

    request = restler.request(url, options);

    request.on('complete', function(data, resp) {
        callback(null, data, resp);
    });

    request.on('fail', function(data, resp) {
        var error = new Error('The API server did not response with ' +
            'a success status code. Please inspect the data ' +
            'response object for more details.');
        callback(error, JSON.parse(data), resp);
    });

    request.on('error', function(resp, error) {
        callback(null, resp, error);
    });
}

module.exports = function() {
    return function(req, res, next) {
        if (req.url.indexOf(PROXY_PREFIX) === 0) {
            handleProxyRequest(req.body.apiKey, req.body.proxy, function(err, resp) {
                if (err) throw err;
                if (resp) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Content-Length': resp.length
                    });
                    res.write(resp);
                } else {
                    res.writeHead(200);
                }
                res.end();
            });
        } else {
            next();
        }
    };
};
