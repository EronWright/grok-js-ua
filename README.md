Grok Web Browser Client
==================

> grok-js-node is the NodeJS client for Grok, Numenta's Prediction Service. It wraps the [Grok HTTP API](http://numenta.github.com/grok-api) in a convenient JavaScript library.

Installation
------------

### Prerequisites

None.

### What to Include on your site

The easiest way to use this library is to include [grok-all.min.js](min/grok-all.min.js) on your page:

    <script src="./path/to/grok/min/grok-all.min.js"></script>

But you can also include the debug version of the library, which contains lots of communication logs:

    <script src="./path/to/grok/src/grok-all.debug.js"></script>


Getting Started
---------------

First, it would probably be benifical to look through the documentation for the [NodeJS Library](http://github.com/numenta/grok-js-node), which contains almost exactly the same codebase (but customized for the NodeJS environment.

It will also be helpful to reference the [Library API Reference](http://numenta.github.com/grok-js/).

### Hello, Grok! Example

This project comes with a directory called `./hello-grok`, which contains an example you can run on your local machine with NodeJS. Simple [install](http://nodejs.org#download) NodeJS, and:

    cd hello-grok
    node index.js

Then point your browser at [http://localhost:8088](http://localhost:8088) and follow the steps in the tutorial. This is an extremely helpful, wizard-style demonstration of how to use the Grok JS library, complete with inline source code.

### Creating a Client

When running the Grok JS Client entirely within a browser, you can create a `GROK.Client` object [normally](http://numenta.github.com/grok-js/symbols/GROK.Client.html) (the same way you would with the [NodeJS Client](http://github.com/numenta.com/grok-js-node)), or if you have a user object with a valid user-id, you can create it like this:

    var client = new GROK.Client('my-api-key', {
        user: {
            id: 'valid-grok-user-id',
            apiKey: 'my-api-key'
        }
    });

This will prevent the necessity to call the [init](http://numenta.github.com/grok-js/symbols/GROK.Client.html#init) function before you can use the client, which would normally validate the API key and retrieve the user object and user-id. You can start using the client object right away with the preparatory API call.

Because the Grok JS Client is essentially a wrapper around a RESTful API, most of the calls from the library must be proxied through your server before being passed onto the Grok API. It is assumed that proxy calls will be made through `_grok`, which should be routed to a processor that can handle the proxy bundles being sent from the client. You can override this location (as well as the location of the API itself) through parameters to the Grok Client.

    var client = new GROK.Client('my-api-key, {
        endpoint: 'http://grok.numenta.com/,
        proxyEndpoint: 'path/to/local/proxy'
    });

Settings
--------

### Log Level

You can change the log-level and see all Grok communication logs like this after including the source on your HTML page:

    GROK.LOG_LEVEL = GROK.LOG.DEBUG;

There are several log levels: `NONE`, `INFO`, `DEBUG`, `WARN`, `ERROR`, and `ALL`.

Getting Help
------------

For technical help as part of our pool of Grok Beta Users, email beta@numenta.com. To file an issue with the library itself, go [here](https://github.com/numenta/grok-js-ua/issues).
