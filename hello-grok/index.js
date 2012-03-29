var connect = require('connect'),
    proxy = require('./apiProxy'),
    PORT = 8088;

connect()
    .use(connect.logger())
    .use(connect.bodyParser())
    .use(proxy())
    .use(connect.static('public'))
    // for deployed examples in "build/"
    .use(connect.static('../src'))
    // for development and testing
    // TODO: remove
    .use(connect.static('../../build/ua/src'))
    .listen(PORT, function() {
        console.log('hello-grok nodejs server running on\n\thttp://localhost:' + PORT);
    });
