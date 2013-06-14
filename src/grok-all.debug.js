
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        /*
         * The Grok global namespace
         */
        global.GROK = {};


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        /**********************************************************************
         * Awesome utilities. Every program needs one.
         *********************************************************************/

        global.GROK.util = {
            /**
             * @return {string} Stringified data object.
             * @param {!Object} data Data object to be stringified.
             */
            toUriParams: function(data) {
                var s = '', key;
                for (key in data) {
                    if (data.hasOwnProperty(key)) {
                        s += key + '=' + encodeURIComponent(data[key]) + '&';
                    }
                }
                s = s.substr(0, s.length - 1);
                return s;
            },

            isSet: function(thing) {
                return thing !== undefined && thing !== null;
            },

            shallowObjectClone: function(obj) {
                return JSON.parse(JSON.stringify(obj));
            },

            /**
             * Straight from the Definitive Guide to JavaScript (5th Ed.), by
             * David Flanagan.
             * @param {Object} p Prototype object to create an heir from.
             */
            heir: function(p) {
                function F() {}   // A dummy constructor function
                F.prototype = p;  // Specify the prototype object we want
                return new F();   // Invoke the constructor to create new object
            }
        };

        global.GROK.LOG = {
            ALL: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            NONE: 5
        };

        // Global GROK log level, defaults to ERROR, but easily overrideable by
        // users.
        global.GROK.LOG_LEVEL = global.GROK.LOG.ERROR;

        global.GROK.log = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.ALL) {
                console.log(msg);
            }
        };
        global.GROK.debug = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.DEBUG) {
                if (console.debug) {
                    console.debug(msg);
                } else {
                    console.log(msg);
                }
            }
        };
        global.GROK.info = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.INFO) {
                console.info(msg);
            }
        };
        global.GROK.warn = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.WARN) {
                console.warn(msg);
            }
        };
        global.GROK.error = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.ERROR) {
                console.error(msg);
            }
        };


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */


 /******************************************************************************
 * This file needs jXHR.js: http://mulletxhr.com
 *  requires ./third/jXHR.js
 *****************************************************************************/

(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK,

            // local defaults
            DEFAULT_XHR_METHOD = 'POST',
            DEFAULT_XHR_ENDPOINT = '/grok',
            DEFAULT_XHR_HEADER = 'x-grok';

        function sendJsonpRequest(jxhr, url, opts) {
            var myUrl = url + '?';

            jxhr.onerror = opts.failure;
            jxhr.onreadystatechange = function(data) {
                if (jxhr.readyState === 4) {
                    if (data.error && opts.failure) {
                        opts.failure(new Error(data.error));
                    }
                    opts.success(JSON.parse(data));
                }
            };
            if (opts.data) {
                myUrl += GROK.util.toUriParams(opts.data) + '&callback=?';
            } else {
                myUrl += 'callback=?';
            }

            jxhr.open(null, myUrl);
            jxhr.send();
        }

        /* executed within the context of the GROK.Request */
        function sendXhr(url, method, opts) {
            var bundle,
                name,
                xhr = this._xhr,
                proxyEndpoint = this._proxyEndpoint || DEFAULT_XHR_ENDPOINT,
                apiKey = this._apiKey;

            opts.failure = opts.failure || function() {};

            // TODO: Allow override of default local XHR endpoint
            xhr.open(DEFAULT_XHR_METHOD, proxyEndpoint);
            // this is JSON data
            xhr.setRequestHeader('Content-Type',
                'application/json;charset=UTF-8');
            // set the grok header for the server proxy
            xhr.setRequestHeader(DEFAULT_XHR_HEADER, '1');

            // add any custom headers
            for (name in opts.headers) {
                if (opts.headers.hasOwnProperty(name)) {
                    xhr.setRequestHeader(name, opts.headers[name]);
                }
            }

            xhr.onreadystatechange = function() {
                var responseData, rawRespHeaders, respHeaders = {};
                if (this.readyState == 4 && this.status == 200) {
                    // it's all good
                    if (opts.success) {
                        if (this.responseText) {
                            try {
                                responseData = JSON.parse(this.responseText);
                            } catch (e) {
                                // Failed to parse JSON, create 'Error' response data
                                responseData = {
                                    errors: [
                                        'Could not parse ' +
                                        'response text from API server: ' +
                                        this.responseText
                                    ]
                                };
                            }
                            if (responseData.errors) {
                                opts.failure(new Error(responseData.errors[0]));
                            } else {
                                opts.success(responseData, this.responseText);
                            }
                        } else {
                            opts.success();
                        }
                    }
                } else if (this.readyState == 4 && this.status !== 0) {
                    // error from the server (status of 0 means nothing to us)
                    if (opts.failure) {
                        rawRespHeaders = this.getAllResponseHeaders();
                        if (rawRespHeaders) {
                            rawRespHeaders.split('\n').forEach(function(line) {
                                var parts = line.split(':');
                                if(parts.length < 2) return;
                                var value = parts[1].trim();
                                if (!isNaN(parseFloat(value)) && isFinite(value)) {
                                    value = new Number(value);
                                }
                                respHeaders[parts[0]] = value;
                            });
                        }
                        opts.failure(
                            new Error('There was an XHR error, status is: ' +
                                this.status),
                            parseInt(this.status),
                            respHeaders
                        );
                    }
                }
            };

            // set up the proxy call into a bundle before stringifying it
            bundle = {
                proxy: {
                    method: method,
                    endpoint: url
                }
            };

            if (apiKey) {
                bundle.apiKey = apiKey;
            }
            if (opts.data) {
                bundle.proxy.data = opts.data;
            }

            xhr.send(JSON.stringify(bundle));
        }

        function shouldUseJsonp(httpMethod, opts) {
            if (opts.forceProxy) {
                return false;
            }
            return httpMethod === 'GET';
        }

        /**
         * Used to make a GROK API call from the browser. This will defer to a
         * proxy on the local server if the request can't be done with JSONP.
         * @constructor
         * @param {object} options Options.
         * @param {string} options.endpoint URL endpoint.
         * @param {string} options.version Version of the API (used to construct
         * complete path to service).
         * @param {string} [options.apiKey] API Key. May not be necessary if all
         * calls are proxied through local server and that server has an API
         * key.
         * @param {string} [options.proxyEndpoint='/grok'] Where on the local
         * server this object should send proxied API calls.
         */
        GROK.Request = function(options) {
            var endpoint = options.endpoint,
                version = options.version,
                apiKey = options.apiKey,
                proxyEndpoint = options.proxyEndpoint,
                join = '';

            if (!endpoint || !version) {
                throw new Error('Cannot create GROK.Request object without ' +
                    'endpoint and version: "new GROK.Request(\'/endpoint\', ' +
                    '\'version\'"');
            }

            // We create the transaction objects up front and attach them to
            // 'this' so they can be easily stubbed for tests. We'll only use
            // one of these, but it doesn't hurt to create them here.

            this._apiKey = apiKey;

            // allow users to provide their own proxy location
            this._proxyEndpoint = proxyEndpoint;

            // TODO: if we ever decide to support IE6, the XHR creation below
            // needs to be also include ActiveXObject creation when XHR is not
            // available.

            /**
             * @type {XMLHttpRequest} _xhr The request, which might be used to
             * send data to the server in order to proxy information to to the
             * REST API.
             */
            this._xhr = new XMLHttpRequest();

            /**
             * @type {jXHR} _jxhr The JSONP transport object used when we can
             * access the REST API with a GET request without needing to proxy
             * through the server.
             */
            this._jxhr = new global.jXHR();

            // add the slash separator if necessary
            if (endpoint.substr(endpoint.length - 1, 1) !== '/') {
                join = '/';
            }
            this._root = endpoint + join + version;
            this.constructor = GROK.Request;
        };

        /**
         * Given the method, endpoint, data, etc in the options, will make
         * either a JSONP call (when method is GET) to retrieve API data, or
         * will proxy back to the server to execute the API call by bundling the
         * call options and deferring to the server through an ajax call.
         *
         * @param {!Object} options All the options.
         * @param {string} options.path The path to append to the API root. For
         * example, if the API root is http://example.com/service/v1 (and that
         * has been established using the 'endpoint' and 'version' values passed
         * into the GROK.Request constructor), then the path might be
         * 'user/123', which would make a request to
         * "http://example.com/service/v1/user/123".
         * @param {string} [options.method='GET'] HTTP method.
         * @param {Object} [options.data] Data to send.
         * @param {function(Object)} [options.success] Function called on
         * success.
         * @param {function(Object)} [options.failure] Function called on
         * failure.
         * @param {Object<string, string>} [options.headers] Key/value pairs of
         * headers to set on the HTTP Request.
         * @param {Boolean} [options.forceProxy=false] When true, will always
         * defer to the local server HTTP proxy, and will never make JSONP
         * requests directly to the remote server.
         */
        GROK.Request.prototype.send = function(options) {
            var httpMethod = options.method || 'GET',
                url = options.url || this._root + '/' + options.path;

            httpMethod = httpMethod.toUpperCase();

            if (shouldUseJsonp(httpMethod, options)) {
                sendJsonpRequest(this._jxhr, url, options);
            } else {
                sendXhr.call(this, url, httpMethod, options);
            }

        };

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {


        var GROK = global.GROK,

            // default input values
            DEFAULT = {
                ENDPOINT: 'https://api.groksolutions.com/',
                VERSION: 'v2',
                FORCE_PROXY: true,
                TIMEOUT: 30000,
                RETRIES: 2
            },

            REQUEST_STATUS = {
                SENT: 1,
                TIMEOUT: 2
            };

        /**
         * Simple object merge utility.
         * @param from
         * @param to
         * @param clobber
         */
        function merge(from, to, clobber) {
            var name;
            if (! to) {
                return from;
            }
            if (typeof clobber === 'undefined') {
                clobber = true;
            }
            if (clobber) {
                to = from;
            } else {
                for (name in from) {
                    to[name] = from[name];
                }
            }
            return to;
        }

        /**
         * @class <p>The super class for all other classes in this library. Do
         * <strong>not</strong> create instances of this class. See
         * {@link GROK.Client} for the starting point for this library.</p>
         *
         * <p>This is the base class for any GROK objects that need to
         * talk to the API to do certain things. It provides easy way to make
         * request to API. It defines concepts such as "details" and "scalars".
         * Because all API objects initially come from a collection of objects
         * (usually), they are only populated with some basic scalar values
         * (like 'id' and 'name'). Any time users need more information about
         * that object instance, they need to make another API call
         * {@link GROK.ApiObject#expand} to get more details about that
         * object.<p/>
         *
         * <p>Those initial scalar values are referred to as 'scalars' within
         * this GROK.ApiObject. Any more details retrieved from the API server
         * and added to the object are referred to as 'details'. As an end-user
         * of any {@link GROK.ApiObject}, you don't need to be concerned with
         * the terms 'scalar' and 'details'. You'll only need to call
         * {@link GROK.ApiObject#get}, which will look in both places. If the
         * value you need is not there, you may need to
         * {@link GROK.ApiObject#expand} to get the attribute you are looking
         * for from the API.</p>
         *
         * @param {Object} scalars The scalar values for this API Object
         * initially retrieved from the API server.
         * @param {Object} options Options used for making calls to the API
         * server.
         * @param {string} [options.endpoint='https://api.groksolutions.com/'] 
         * URL to make the request to.
         * @param {string} [options.proxyEndpoint='/grok'] When API proxy calls
         * are made, they will be made to this endpoint on the local server.
         * @param {string} [options.version='v1'] Version of the API (used to
         * construct complete path to service).
         * @param {Object} [options.httpHeaders={}] HTTP headers.
         * @param {string} options.userId User id.
         * @param {string} [options.apiKey] API Key. May not be necessary if all
         * calls are proxied through local server and that server has an API
         * key.
         */
        GROK.ApiObject = function(scalars, options) {
            options = options || {};
            scalars = scalars || {};
            this.setScalars(scalars);
            this.setDetails({});
            this.setEndpoint(options.endpoint || DEFAULT.ENDPOINT);
            this.setProxyEndpoint(options.proxyEndpoint);
            this.setVersion(options.version || DEFAULT.VERSION);
            this.setTimeout(typeof options.timeout !== 'undefined' ? options.timeout : DEFAULT.TIMEOUT);
            this.setRetries(typeof options.retries !== 'undefined' ? options.retries : DEFAULT.RETRIES);
            this.setHeaders(options.httpHeaders || {});
            this.setUserId(options.userId);
            this.setApiKey(options.apiKey);
            this.rawJSON = options.rawJSON;
            // This object keeps track of all outstanding requests
            this._requests = {};
            // Used provide unique request ids
            this._requestIncrement = 0;
        };

        /**
         * When switched to true, all requests will go through the local server
         * proxy, even when they could be accomplished with JSONP.
         *
         * @static
         * @default true
         */
        GROK.ApiObject.FORCE_PROXY = DEFAULT.FORCE_PROXY;

        /**
         * Gets all attributes, whether they are 'scalars' or 'details'. The
         * 'details' will override the 'scalars'.
         * @return {Object} All attributes, both scalar and otherwise.
         */
        GROK.ApiObject.prototype.getAttrs = function() {
            var s = this._scalars,
                d = this._details,
                out = {},
                name;
            // we do not return "private properties" like _one and _two
            for (name in s) {
                if (s.hasOwnProperty(name) && name.indexOf('_') !== 0) {
                    out[name] = s[name];
                }
            }
            for (name in d) {
                if (d.hasOwnProperty(name) && name.indexOf('_') !== 0) {
                    out[name] = d[name];
                }
            }
            return out;
        };

        /**
         * Synonym for "get()".
         * @param {string} name Name of the attribute.
         * @return {Object} Value of attribute.
         */
        GROK.ApiObject.prototype.getAttr = function(name) {
            return this.get(name);
        };

        /**
         * Retrieves a value from the 'scalar' attributes first if it exists,
         * then the 'detail' attributes. Or nothing if attr doesn't exist.
         * @param {string} name Name of attribute to get.
         * @return {Object} Value of attribute.
         */
        GROK.ApiObject.prototype.get = function(name) {
            var result = this._scalars[name];
            if (! result && this._details) {
                // if no scalar value, and yes detail value, use it
                result = this._details[name];
            }
            return result;
        };

        /**
         * Gets the object's globally unique identifier.
         * @return {string} The object guid.
         */
        GROK.ApiObject.prototype.getId = function() {
            return this.get('id');
        };

        /**
         * Set a new endpoint for the API (there can be only one). Used to
         * construct complete URLs to services.
         * @param {string} endpoint URL endpoint.
         */
        GROK.ApiObject.prototype.setEndpoint = function(endpoint) {
            this._apiEndpoint = endpoint;
        };

        /**
         * Sets the endpoint for the local rest proxy.
         * @param {string} endpoint URL endpoint.
         */
        GROK.ApiObject.prototype.setProxyEndpoint = function(endpoint) {
            this._proxyEndpoint = endpoint;
        };

        /**
         * Gets the local API proxy endpoint.
         * @return {string} URL endpoint.
         */
        GROK.ApiObject.prototype.getProxyEndpoint = function() {
            return this._proxyEndpoint;
        };

        /**
         * Gets the endpoint URL for API calls.
         * @return {string} URL endpoint.
         */
        GROK.ApiObject.prototype.getEndpoint = function() {
            return this._apiEndpoint;
        };

        /**
         * Set a new version for the API, which is used to build the complete
         * URLs to services.
         * @param {string} version Version of the API (used to construct
         * complete path to service).
         */
        GROK.ApiObject.prototype.setVersion = function(version) {
            this._apiVersion = version;
        };

        /**
         * Gets the API version
         * @return {string} api version.
         */
        GROK.ApiObject.prototype.getVersion = function() {
            return this._apiVersion;
        };

        /**
         * Sets the timeout in milliseconds for any API calls.
         * @param {Number} timeout in ms
         */
        GROK.ApiObject.prototype.setTimeout = function(timeout) {
            this._timeout = timeout;
        };

        /**
         * Gets the timeout used for API calls in milliseconds
         * @return {Number} ms before a call times out.
         */
        GROK.ApiObject.prototype.getTimeout = function() {
            return this._timeout;
        };

        /**
         * Sets the number of retries to attempt when making API calls.
         * @param {Number} how many retries
         */
        GROK.ApiObject.prototype.setRetries = function(retries) {
            this._retries = retries;
        };

        /**
         * Gets the number of retries to attempt when making API calls.
         * @return {Number} how many retries
         */
        GROK.ApiObject.prototype.getRetries = function() {
            return this._retries;
        };

        /**
         * Sets user id.
         * @param {string} userId User Id.
         */
        GROK.ApiObject.prototype.setUserId = function(userId) {
            this._userId = userId;
        };
        /**
         * Gets user id.
         * @return {string} user id.
         */
        GROK.ApiObject.prototype.getUserId = function() {
            return this._userId;
        };

        /**
         * Set an API Key secret.
         * @param {string} [apiKey] API Key. May not be necessary if all calls
         * are proxied through local server and that server has an API key.
         */
        GROK.ApiObject.prototype.setApiKey = function(apiKey) {
            this._apiKey = apiKey;
        };
        /**
         * Gets the current API key.
         * @return {string} API key.
         */
        GROK.ApiObject.prototype.getApiKey = function() {
            return this._apiKey;
        };

        /**
         * Sets any headers that should be sent along with requests being made
         * to API proxy.
         * @param {Object} headers HTTP header map.
         */
        GROK.ApiObject.prototype.setHeaders = function(headers) {
            this._httpHeaders = headers || {};
        };

        /**
         * Gets the headers that have been set.
         * @return {Object} Headers.
         */
        GROK.ApiObject.prototype.getHeaders = function() {
            return this._httpHeaders;
        };

        /**
         * Calling expand will make an API call to get more details about this
         * object, then set those details onto the object. This function pays
         * no attention to any existing 'detail' attributes. It will always
         * make the API call and clobber them.
         *
         * @param {Function} ApiSubclass The subclass of GROK.ApiObject.
         * @param {Function(Error, Object} fn Will be called with either an err
         * or the expanded object's details.
         */
        GROK.ApiObject.prototype.expand = function(ApiSubclass, fn) {
            GROK.debug('ApiObject.expand for ' + this.constructor.NAMESPACE);
            var me = this,
                namespace = ApiSubclass.NAMESPACE,
                singularNamespace = namespace.substr(0, namespace.length - 1),
                apiPath = this.get('url');
            GROK.debug('Expanding ' + singularNamespace);
            this.makeRequest({
                method: 'GET',
                url: apiPath,
                success: function(details) {
                    var data = details[singularNamespace];
                    me.setDetails(data);
                    fn(null, me.getDetails());
                },
                failure: function(err) {
                    fn(err);
                }
            });
        };

        /**
         * Deletes this object through the API. Once this has occurred, you
         * should seriously just de-reference this object. It is useless to you.
         * @param {function(Error)} callback Function to be called when delete
         * has completed.
         */
        GROK.ApiObject.prototype['delete'] = function(callback) {
            GROK.debug('ApiObject.delete for ' + this.constructor.NAMESPACE);
            var me = this;
            this.makeRequest({
                method: 'DELETE',
                url: this.get('url'),
                success: function() {
                    // strip the local project object
                    var name;
                    for (name in me) {
                        // don't care about hasOwnProperty here
                        delete me[name];
                    }
                    callback();
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Helper method used to make an API request. This will actually create
         * a new GROK.Request object using the endpoint, version, and api key
         * specified, and send the request using the options given.
         *
         * @param {!Object} options All the options.
         * @param {string} options.path The path to append to the API root. For
         * example, if the API root is http://example.com/service/v1 (and that
         * has been established using the 'endpoint' and 'version' values passed
         * into the GROK.Request constructor), then the path might be
         * 'user/123', which would make a request to
         * "http://example.com/service/v1/user/123".
         * @param {string} [options.method='GET'] HTTP method.
         * @param {Object} [options.data] Data to send.
         * @param {function(Object)} [options.success] Function called on
         * success.
         * @param {function(Object)} [options.failure] Function called on
         * failure.
         * @param {Object<string, string>} [options.headers] Key/value pairs of
         * headers to set on the HTTP Request.
         * @param {Boolean} [options.forceProxy] When true, will always
         * defer to the local server HTTP proxy, and will never make JSONP
         * requests directly to the remote server.
         */
        GROK.ApiObject.prototype.makeRequest = function(options) {
            GROK.info('GROK.ApiObject.makeRequest for ' +
                this.constructor.NAMESPACE);
            GROK.debug(options);

            var name,
                error,
                timeout = this.getTimeout(),
                maxRetries = this.getRetries(),
                instanceHeaders = GROK.util.shallowObjectClone(
                    this._httpHeaders
                ),
                // a shallow clone of the options sent into this function, with
                // some modifications.
                sendOptions,
                requestDetails,
                grokRequest;

            // we cannot process this request if both "url" and "path" are
            // missing
            if (! options.url && ! options.path) {
                error = new Error('Cannot make request without an absolute ' +
                    '"url" or relative "path".');
                if (options.failure) {
                    options.failure(error);
                    return;
                } else {
                    throw error;
                }
            }

            // if no headers are in the local options, we'll use those specified
            // in the ApiObject constructor
            if (! options.headers) {
                options.headers = instanceHeaders;
            }
            // mix in any user-defined headers into our local headers
            else {
                for (name in instanceHeaders) {
                    // don't override any headers specified locally
                    if (! options.headers[name]) {
                        options.headers[name] = instanceHeaders[name];
                    }
                }
            }
            // If user doesn't override the 'forceProxy' value, we use the
            // class-level value.
            if (! GROK.util.isSet(options.forceProxy)) {
                options.forceProxy = GROK.ApiObject.FORCE_PROXY;
            }

            grokRequest = new global.GROK.Request({
                endpoint: this.getEndpoint(),
                version: this.getVersion(),
                apiKey: this.getApiKey(),
                proxyEndpoint: this.getProxyEndpoint()
            });

            function constructRequestOptions(options, requestDetails) {
                var requestOptions = {};
                // shallow clone
                Object.keys(options).forEach(function(optionKey) {
                    requestOptions[optionKey] = options[optionKey];
                });

                requestOptions.success = callbackWrapper(options.success, requestDetails);
                requestOptions.failure = callbackWrapper(options.failure, requestDetails);

                return requestOptions;
            }

            /*
             * This callback wrapper allows us to intercept all responses from
             * the API for bookkeeping. We use it to track timeouts and retries.
             */
            function callbackWrapper(originalFunction, requestTracker) {
                return function(result, status, headers) {
                    var error,
                        requestId = requestTracker.id,
                        requestOptions = requestTracker.options;
                    // Always affix the status code to the result object if it is
                    // an error
                    if (result instanceof Error) {
                        result.statusCode = status;
                    }
                    // If this was flagged as a timeout in the timeout callback,
                    // we'll need to resend it until the max number of retries
                    // is reached.
                    if (requestTracker.status === REQUEST_STATUS.TIMEOUT) {
                        // if there are more retries to attempt, do it
                        if (requestTracker.retries < maxRetries) {
                            // Because we're going to send another request, we
                            // clear any existing interval attached to this
                            // request before we resend it.
                            clearTimeout(requestTracker);
                            // flag as sent again
                            requestTracker.status = REQUEST_STATUS.SENT;
                            // Keep track of all our retries so we don't make
                            // too many.
                            requestTracker.retries++;
                            GROK.debug('GROK.ApiObject.makeRequest: resent ' + requestId + ' (' + requestTracker.retries + ' times)');
                            // start a new timeout counter for this new request
                            startTimeout(requestTracker, timeout);
                            // Resend the request!
                            requestTracker.request.send(constructRequestOptions(requestOptions, requestTracker));
                        }
                        // if there are no retries, we throw a Timeout Error
                        else {
                            error = new Error('API call to "' +
                                (requestOptions.url || requestOptions.path) +
                                '" timed out after ' + timeout + 'ms and ' + requestTracker.retries + ' retries.');
                            if (requestOptions.failure) {
                                requestOptions.failure(error);
                            } else {
                                throw error;
                            }
                        }
                    } else if (status === 503 && headers && headers['Retry-After']) {
                        // When a 503 with Retry-After header is received from API, we want
                        // to always respect it. We'll clear any timeout that's currently active
                        // for this request and start a new one using the header value.
                        clearTimeout(requestTracker);
                        setTimeout(function() {
                            // start a new timeout counter for this new request
                            startTimeout(requestTracker, timeout);
                            // Resend the request!
                            requestTracker.request.send(constructRequestOptions(requestOptions, requestTracker));
                        }, headers['Retry-After'] * 1000);
                    } else {
                        // The response was received before the timeout
                        // occurred. This is the happy path, and we should clear
                        // the timeout and call the original callback.
                        clearTimeout(requestTracker);
                        if (originalFunction) {
                            originalFunction.apply(this, arguments);
                        }
                    }
                }
            }

            function clearTimeout(requestTracker) {
                clearInterval(requestTracker.timeoutInterval);
                delete requestTracker.timeoutInterval;
            }

            function startTimeout(requestTracker, localTimeout) {
                if (localTimeout > 0) {
                    // This interval will execute when the request times out, or else it
                    // will be cleared when a success response comes back.
                    GROK.debug('GROK.ApiObject.makeRequest: starting ' + localTimeout + 'ms timeout for request ' + requestTracker.id);
                    requestTracker.timeoutInterval = setTimeout(function() {
                        // A TIMEOUT HAS OCCURRED.
                        GROK.debug('GROK.ApiObject.makeRequest: request ' + requestTracker.id + '(' + requestTracker.status + ') timed out');
                        requestTracker.status = REQUEST_STATUS.TIMEOUT;
                    }, localTimeout);
                }
            }

            // Log this request with a unique request id so we can keep track
            // of how many retries have been made, as well as what status it is.
            requestDetails = {
                id: this._requestIncrement++,
                request: grokRequest,
                retries: 0,
                options: options,
                status: REQUEST_STATUS.SENT
            };

            startTimeout(requestDetails, timeout);

            sendOptions = constructRequestOptions(options, requestDetails);

            // send the request!
            grokRequest.send(sendOptions);
        };

        ////////////////////////////////////////////////////////////////////////
        // The functions below are only meant to be used by subclasses of     //
        // GROK.ApiObject. Even though they are not truly protected, they are //
        // meant to be.                                                       //
        ////////////////////////////////////////////////////////////////////////

        ////////////////////////////////////////////////////
        // Dealing with attributes (scalars and details). //
        ////////////////////////////////////////////////////

        /**
         * Sets one scalar value.
         * @private
         * @param {string} key Key.
         * @param {Object} value The value to set, could be anything.
         */
        GROK.ApiObject.prototype.setScalar = function(key, value) {
            this._scalars[key] = value;
        };

        /**
         * Sets all scalar values.
         * @private
         * @param {Object} scalars All scalars to set.
         * @param {Boolean} [clobber=true] Override all scalars?
         */
        GROK.ApiObject.prototype.setScalars = function(scalars, clobber) {
            this._scalars = merge(scalars, this._scalars, clobber);
        };

        /**
         * Gets all scalar values.
         * @private
         * @return {Object} All scalar values.
         */
        GROK.ApiObject.prototype.getScalars = function() {
            return this._scalars || {};
        };

        /**
         * Gets one scalar value by name.
         * @private
         * @param {string} name Name of scalar to get.
         * @return {Object} Scalar value of name.
         */
        GROK.ApiObject.prototype.getScalar = function(name) {
            return this._scalars[name];
        };

        /**
         * Sets all details.
         * @private
         * @param {Object} details All details to set.
         */
        GROK.ApiObject.prototype.setDetails = function(details, clobber) {
            this._details = merge(details, this._details, clobber);
        };

        /**
         * Sets one detail.
         * @private
         */
        GROK.ApiObject.prototype.setDetail = function(name, value) {
            this._details[name] = value;
        };

        /**
         * Gets all details.
         * @private
         * @return {Object} All details.
         */
        GROK.ApiObject.prototype.getDetails = function() {
            return this._details || {};
        };

        /**
         * Gets one detail value.
         * @private
         * @param {string} name Name of detail.
         * @return {Object} Value of detail.
         */
        GROK.ApiObject.prototype.getDetail = function(name) {
            return this._details[name];
        };

        /**
         * Specifies whether this objects details have been retrieved from the
         * API server yet, and whether they are available locally.
         * @private
         * @return {boolean} True if details are set locally.
         */
        GROK.ApiObject.prototype.hasDetails = function() {
            return GROK.util.isSet(this._details);
        };

        ////////////////////////////////////////////////////
        // Dealing with objects and the API.              //
        ////////////////////////////////////////////////////

        /**
         * This will expand the subclass that calls it. The object will be
         * updated behind the scenes referentially.
         * @private
         * @param {function(Error)} callback Called when done.
         */
        GROK.ApiObject.prototype.populate = function(callback) {
            this.expand(this.constructor, callback);
        };

        /**
         * Called to update any api object. The object will be
         * updated behind the scenes referentially.
         * @private
         * @param {object} props Properties to update.
         * @param {function(Error)} callback Called when complete.
         */
        GROK.ApiObject.prototype.update = function(props, callback) {
            this.updateObject(this.constructor, props, callback);
        };

        /**
         * @private
         */
        GROK.ApiObject.prototype.listObjects = function() {

            GROK.debug('GROK.ApiObject.listObjects for ' +
                this.constructor.NAMESPACE);

            var ApiSubclass = arguments[0],
                data = typeof(arguments[1]) === 'function' ? {} : arguments[1],
                callback = typeof(arguments[1]) === 'function' ?
                    arguments[1] : arguments[2],
                me = this,
                // the resulting list will be within an object keyed by the type
                // of object it contains, which is the same as the last token
                // in the original URL called. We can get that here:
                subclassNamespace = ApiSubclass.NAMESPACE,
                // gets the API path for 'projectsUrl' or 'modelsUrl'
                apiPath = this.get(subclassNamespace + 'Url');

            this.makeRequest({
                method: 'GET',
                url: apiPath,
                data: data,
                success: function(resp) {
                    var i = 0,
                        objects = resp[subclassNamespace];
                    for (; i < objects.length; i++) {
                        objects[i] = new ApiSubclass(
                            objects[i],
                            me._getDefaultChildOptions()
                        );
                        // set the parent, so it can use it to execute API
                        // operations if it needs to
                        objects[i].setScalar('_parent', me);
                    }
                    callback(null, objects);
                },
                failure: function(error) {
                    callback(error);
                }
            });
        };

        /**
         * @private
         */
        GROK.ApiObject.prototype.createObject = function(ApiSubclass,
                                                         objectProperties,
                                                         callback) {

            GROK.debug('GROK.ApiObject.createObject for ' +
                this.constructor.NAMESPACE);

            var me = this,
                namespace = ApiSubclass.NAMESPACE,
                singularNamespace = namespace.substr(0, namespace.length - 1),
                data = {};

            data[singularNamespace] = objectProperties;
            // make request to create the project
            this.makeRequest({
                method: 'POST',
                url: this.get(namespace + 'Url'),
                data: data,
                success: function(resp) {
                    var newObject = new ApiSubclass(resp[singularNamespace],
                        me._getDefaultChildOptions()
                    );
                    newObject.setScalar('_parent', me);
                    callback(null, newObject);
                },
                failure: function(error) {
                    callback(error);
                }
            });
        };

        /**
         * @private
         */
        GROK.ApiObject.prototype.getObject = function(ApiSubclass,
                                                      id,
                                                      callback) {

            GROK.debug('GROK.ApiObject.getObject for ' +
                this.constructor.NAMESPACE);

            var me = this,
                namespace = ApiSubclass.NAMESPACE,
                singularNamespace = namespace.substr(0, namespace.length - 1);
            this.makeRequest({
                method: 'GET',
                url: this.get(namespace + 'Url') + '/' + id,
                success: function(responseData, responseText) {
                    var childOptions = me._getDefaultChildOptions();
                    // inject the raw JSON that created this object
                    childOptions.rawJSON = responseText;
                    callback(null,
                        new ApiSubclass(responseData[singularNamespace],
                            childOptions
                        )
                    );
                },
                failure: function(error) {
                    callback(error);
                }
            });
        };

        /**
         * @private
         */
        GROK.ApiObject.prototype.updateObject = function(ApiSubclass,
                                                         updatedProps,
                                                         callback) {

            GROK.debug('GROK.ApiObject.updateObject for ' +
                this.constructor.NAMESPACE);

            var me = this,
                name,
                namespace = ApiSubclass.NAMESPACE,
                singularNamespace = namespace.substr(0, namespace.length - 1),
                updateObject,
                fullUpdate = {};
            updateObject = me.getAttrs();

            // merge updated properties over top of complete object
            for (name in updatedProps) {
                if (updatedProps.hasOwnProperty(name)) {
                    updateObject[name] = updatedProps[name];
                }
            }
            fullUpdate[singularNamespace] = updateObject;
            this.makeRequest({
                method: 'POST',
                url: this.get('url'),
                data: fullUpdate,
                success: function() {
                    // successful update, so set the updated properties onto
                    // self
                    me.setDetails(updateObject, false);
                    me.setScalars(updateObject, false);
                    callback();
                },
                failure: function(error) {
                    callback(error);
                }
            });
        };

        /**
         * @private
         */
        GROK.ApiObject.prototype._getDefaultChildOptions = function() {
            return {
                endpoint: this.getEndpoint(),
                proxyEndpoint: this.getProxyEndpoint(),
                version: this.getVersion(),
                headers: this.getHeaders(),
                userId: this.getUserId(),
                apiKey: this.getApiKey()
            };
        };

        /**
         * Converts object into JSON representation.
         * @return {string} JSON string.
         */
        GROK.ApiObject.prototype.toJSON = function() {
            var args = [this.getAttrs()].concat(Array.prototype.slice.call(arguments));
            return JSON.stringify.apply(JSON, args);
        };


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK;

        /**
         * @class Stream object, which represents a set of data and its
         * definition for a model to use when making predictions. Do not use
         * this constructor to create a {@link GROK.Stream} object, use other
         * API objects like {@link GROK.Client#createStream} or
         * {@link GROK.Project#createStream}.
         *
         * @extends GROK.ApiObject
         * @param {Object} attrs Values to create this project with.
         * @param {Object} options Options passed upwards to
         * {@link GROK.ApiObject}.
         */
        GROK.Stream = function(attrs, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Stream;
        };

        GROK.Stream.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Stream.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Stream.NAMESPACE = 'streams';

        /**
         * The different field aggregation values that can be used when creating
         * streams.
         */
        GROK.Stream.AGGREGATION = {
            RECORD: 'record',
            SECONDS: 'seconds',
            MINUTES: 'minutes',
            MINUTES_15: 'minutes15',
            HOURS: 'hours',
            DAYS: 'days',
            WEEKS: 'weeks',
            MONTHS: 'months'
        };
        /**
         * Data types available when creating stream fields.
         */
        GROK.Stream.DATATYPE = {
            DATETIME: 'DATETIME',   // a point in time.
            CATEGORY: 'CATEGORY',   // a category.
            SCALAR: 'SCALAR'        // a numeric value.
        };
        /**
         * Data flags available when creating stream fields.
         */
        GROK.Stream.DATAFLAG = {
            TIMESTAMP: 'TIMESTAMP',
            LOCATION: 'LOCATION'
        };
        /**
         * Aggregation functions available when creating stream fields.
         */
        GROK.Stream.AGGREGATION_FUNCTION = {
            FIRST: 'first',
            LAST: 'last',
            AVERAGE: 'average',
            SUM: 'sum',
            MAX: 'max',
            MIN: 'min'
        };
        /**
         * Prediction types available when creating stream fields.
         */
        GROK.Stream.PREDICTION_TYPE = {
            TEMPORAL: 'temporal',
            SPATIAL: 'spatial'
        };
        /**
         * Holiday locales that can be used for input data when creating stream
         * fields.
         */
        GROK.Stream.HOLIDAY_LOCALE = {
            US_HOLIDAYS: "US-HOLIDAYS",
            UK_HOLIDAYS: "UK-HOLIDAYS",
            CA_HOLIDAYS: "CA-HOLIDAYS"
        };
        
        /**
         * <p>Add new data to a stream, which will be passed to the API. The
         * data should be an array of arrays, which represents rows and
         * fields.</p>
         *
         * <p>The data you add must match the format of the stream specification
         * used to create the stream.</p>
         *
         * @param {Object} rawData Should be an array of data to add to a
         * streams input cache.
         * @param {function(Error)} callback Called when added.
         */
        GROK.Stream.prototype.addData = function(rawData, callback) {
            this.makeRequest({
                method: 'POST',
                url: this.get('dataUrl'),
                data: {
                    input: rawData
                },
                success: function() {
                    callback();
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Get the current data within a stream's input cache.
         * @param {function(Error)} callback Called when data is retrieved.
         */
        GROK.Stream.prototype.getInputData = function(callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('dataUrl'),
                success: function(resp) {
                    if (! resp.input) {
                        callback(new Error('malformed API response! ' +
                            'Expected "input" key.'));
                    } else {
                        callback(null, resp.input);
                    }
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };



/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK,
            DEFAULT_SWARM_MONITOR_INTERVAL = 1000,
            DEFAULT_PROMOTION_INTERVAL = 500;

        /**
         * @class <p>Grok Model, used to contain a {@link GROK.Stream} object
         * and swarm against it, eventually producing predictions on the
         * stream.</p>
         *
         * <p>Once you have a valid Grok model object, you can do many things
         * with it, but you'll never actually constuct one manually. You will
         * get a {@link GROK.Model} object by using other objects from the API
         * and their functions, such as {@link GROK.Project#createModel},
         * {@link GROK.Project#getModel}, {@link GROK.Project#listModels},
         * {@link GROK.Client#createModel}, {@link GROK.Client#getModel}, and
         * {@link GROK.Client#listModels}.</p>
         *
         * @extends GROK.ApiObject
         * @param {Object} attrs Values to create this project with.
         * @param {Object} options Options passed upwards to GROK.ApiObject.
         */
        GROK.Model = function(attrs, options) {
            options = options || {};
            if (options.promotionInterval === undefined) {
                this.promotionInterval = DEFAULT_PROMOTION_INTERVAL;
            }
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Model;
        };

        GROK.Model.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Model.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Model.NAMESPACE = 'models';

        /**
         * Get a model's name.
         * @return {string} Model name.
         */
        GROK.Model.prototype.getName = function() {
            return this.getAttr('name');
        };

        /**
         * Clones this model into a new model instance.
         * @param {function(Error, GROK.Model} callback Called with cloned
         * {@link GROK.Model}.
         */
        GROK.Model.prototype.clone = function(callback) {
            var me = this,
                parent = this.getScalar('_parent');
            // before cloning, we need to go get all the model details from the
            // API if we have not already
            if (! this.hasDetails()) {
                this.populate(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        parent.createModel(me.getAttrs(), callback);
                    }
                });
            } else {
                parent.createModel(me.getAttrs(), callback);
            }
        };

        /**
         * Gets the stream contained by this model.
         * @param {function(Error, GROK.Stream} callback Called with this
         * model's {@link GROK.Stream}.
         */
        GROK.Model.prototype.getStream = function(callback) {
            var streamId = this.get('streamId'),
                parent = this.get('_parent');
            parent.getStream(streamId, callback);
        };

        /**
         * <p>Returns predictions from a model.</p>
         * <pre class="code">
         *     model.getOutputData({shift: true}, function(err, output) {
         *         if (err) { throw err; }
         *         var alignedRows = model.alignOutputData(output);
         *     });
         * </pre>
         * @param {Object} [opts] Options.
         * @param {Number} [opts.limit] Limits the total output rows returned.
         * @param {Boolean} [opts.shift] Tells the API to shift the output data
         * so that predictions are on the same row as the actual data for that
         * prediction.
         * @param {Number} [opts.startAt] ROWID to start the results (ROWIDs 
         * are included in prediction output).
         * @param {function(Error, Object, Object} callback Called with output
         * data and meta information about the data.
         */
        GROK.Model.prototype.getOutputData = function(opts /*optional*/, callback) {
            var me = this, cb, limit, shift, startAt;
            if (typeof opts === 'function') {
                cb = opts;
            } else {
                limit = opts.limit || 1000;
                shift = opts.shift || false;
                startAt = opts.startAt || 0;
                cb = callback;
            }
            this.makeRequest({
                data: {
                    limit: limit,
                    shift: shift,
                    startAt: startAt
                },
                url: this.get('dataUrl'),
                success: function(data) {
                    // handle null output by replacing with empty containers
                    var output = data.output || { data: [], names: [], meta: {} };
                    cb(null, output);
                },
                failure: function(err) {
                    cb(err);
                }
            });
        };

        /**
         * After data has been added to a promoted model's stream object, you
         * can monitor for streaming predictions using this function.
         * @param {Object} [opts] Options for polling the predictions
         * @param {Number} [opts.interval] How often to poll the API for
         * predictions.
         * @param {Number} [opts.limit] Max number of rows of predictions to
         * return once all the predictions have finished streaming.
         */
        GROK.Model.prototype.monitorPredictions = function(opts) {
            var monitor;
            opts = opts || {};
            opts.interval = opts.interval || 1000;
            opts.timeout = opts.timeout || 30;
            monitor = new GROK.PredictionMonitor(this, {
                debug: opts.debug,
                interval: opts.interval,
                outputDataOptions: opts.outputDataOptions,
                timeout: opts.timeout,
                lastRowIdSeen: opts.lastRowIdSeen
            });
            if (opts.onUpdate) {
                monitor.onData(opts.onUpdate);
            }
            if (opts.onDone) {
                monitor.onDone(opts.onDone);
            }
            if (opts.onError) {
                monitor.onError(opts.onError);
            }
            monitor.start();
            return monitor;
        };

        /**
         * Lists all the {@link GROK.Swarm}s run against this model's stream.
         * @param {function(Error, [GROK.Swarm]} callback Called with list of
         * {@link GROK.Swarm} objects.
         */
        GROK.Model.prototype.listSwarms = function(callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('swarmsUrl'),
                success: function(data) {
                    callback(null, data.swarms);
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Starts a new {@link GROK.Swarm} against the model.
         * @param {Object} [opts] Options for call to API
         * @param {string} [opts.size] Size of swarm: 'small', 'medium', or
         * 'large'.
         * @param {function(Error, GROK.Swarm} callback Called with new
         * {@link GROK.Swarm} object.
         */
        GROK.Model.prototype.startSwarm = function(opts/* optional */, callback) {
            var me = this, cb, size, interval, debug;
            if (typeof opts === 'function') {
                cb = opts;
            } else {
                size = opts.size || GROK.Swarm.SIZE.MEDIUM;
                interval = opts.interval || DEFAULT_SWARM_MONITOR_INTERVAL;
                debug = opts.debug;
                cb = callback;
            }
            this.makeRequest({
                method: 'POST',
                data: {
                    options: {
                        size: size
                    }
                },
                url: this.get('swarmsUrl'),
                success: function(data, respText) {
                    var swarmAttrs = data.swarm,
                        swarm = new GROK.Swarm(swarmAttrs, {rawJSON: respText});
                    // add this model as the swarm's parent
                    swarmAttrs._parent = me;
                    cb(
                        null,
                        swarm,
                        new GROK.SwarmMonitor(swarm, {
                            interval: interval,
                            debug: debug
                        })
                    );
                },
                failure: function(err) {
                    cb(err);
                }
            });
        };

        /**
         * Sends a command to the API to stop swarming. The command is sent to
         * the API, but it could take time for the Grok engine to actually stop
         * the swarm.
         * @param {function(Error)} callback Called when command has been sent.
         */
        GROK.Model.prototype.stopSwarm = function(callback) {
            var me = this;
            this.makeRequest({
                method: 'POST',
                url: this.get('commandsUrl'),
                data: {
                    command: 'stop'
                },
                success: function() {
                    // on success, make sure we update the model status
                    me.setScalar('status', GROK.Swarm.STOPPED);
                    callback();
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Sends a command to the API to start a model. This should be done
         * after a model is promoted.
         * @param {function(Error)} callback Called when command has been sent.
         */
        GROK.Model.prototype.start = function(callback) {
            var me = this;
            this.makeRequest({
                method: 'POST',
                url: this.get('commandsUrl'),
                data: {
                    command: 'start'
                },
                success: function() {
                    // on success, make sure we update the model status
                    me.setScalar('status', GROK.Swarm.RUNNING);
                    callback();
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Gets a {@link GROK.Swarm} object.
         * @param {string} swarmId Swarm id.
         * @param {function(Error, GROK.Swarm} callback Called with
         * {@link GROK.Swarm}.
         */
        GROK.Model.prototype.getSwarm = function(swarmId, callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('swarmsUrl') + '/' + swarmId,
                success: function(data, respText) {
                    callback(null, new GROK.Swarm(data.swarm, {rawJSON: respText}));
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Returns all checkpoints.
         * @param {function(Error, [Object]} callback Given all checkpoints,
         * represented as simple objects.
         */
        GROK.Model.prototype.listCheckpoints = function(callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('checkpointsUrl'),
                success: function(data) {
                    callback(null, data.checkpoints);
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Tags a new checkpoint.
         * @param {function(Error, Object} callback Called with object
         * representing the checkpoint.
         */
        GROK.Model.prototype.createCheckpoint = function(callback) {
            this.makeRequest({
                method: 'POST',
                url: this.get('checkpointsUrl'),
                success: function(data) {
                    callback(null, data.checkpoint);
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Promotes a {@link GROK.Model} to production. Do this once you are
         * happy with a model's swarm results and are ready to start receiving
         * predictions.
         *
         * @param {function} callback Called after promotion.
         */
        GROK.Model.prototype.promote = function(callback) {
            var me = this,
                callbackCalled,
                initialOutputLength;

            function whenRunning() {
                var passedCacheInterval = setInterval(function() {
                        me.getOutputData(function(err, outputData) {
                            if (err) { return callback(err); }

                            if (! callbackCalled &&
                                outputData.data.length >= initialOutputLength) {
                                clearInterval(passedCacheInterval);
                                // we are done!!
                                callback();
                                callbackCalled = true;
                            }
                        });
                    }, me.promotionInterval);
            }

            function afterPromotion() {
                me.getOutputData(function(err, outputData) {
                    var runningInterval;

                    if (err) { return callback(err); }

                    initialOutputLength = outputData.data.length;

                    runningInterval = setInterval(function() {
                        me.populate(function(err, modelDetails) {
                            if (err) { return callback(err); }
                            // TODO: The fact that I need to go to the
                            // modelDetails return values is a bug. I should be
                            // able to do:
                            //   me.get('status')
                            // and it should be up to date, but for some reason it is not.
                            //
                            // http://tracker:8080/browse/GRK-911

                            if (modelDetails.status === 'running' && runningInterval) {
                                clearInterval(runningInterval);
                                runningInterval = null;
                                whenRunning();
                            }
                        });
                    }, me.promotionInterval);

                });

            }

            this.makeRequest({
                method: 'POST',
                url: this.get('commandsUrl'),
                data: {
                    command: 'promote'
                },
                success: function() {
                    afterPromotion();
                },
                failure: function(err) {
                    callback(err);
                }
            });

        };



















/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK;

        /**
         * @class A swarm represents a state within the grok engine where a
         * model and its data are being processed to find the best
         * representation for data prediction. Do note create this object
         * manually, use {@link GROK.Model#startSwarm} to create new swarms.
         *
         * @extends GROK.ApiObject
         * @param {Object} attrs Values to create this project with.
         * @param {Object} options Options passed upwards to GROK.ApiObject.
         */
        GROK.Swarm = function(attrs, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Swarm;
        };

        GROK.Swarm.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Swarm.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Swarm.NAMESPACE = 'swarms';

        /**
         * The statuses a swarm might be in.
         * @static
         */
        // TODO: These are acutally model statuses, not swarm statuses
        GROK.Swarm.STATUS = {
            STOPPED: 'stopped',
            COMPLETED: 'completed',
            CANCELLED: 'cancelled',
            NOT_STARTED: 'not_started',
            RUNNING: 'running',
            SWARMING: 'swarming',
            ERROR: 'error'
        };

        /**
         * The statuses a model might be in.
         * @static
         */
        GROK.Model.STATUS = {
            STARTING: 'starting',
            SWARMING: 'swarming',
            RUNNING: 'running',
            STOPPED: 'stopped',
            ERROR: 'error'
        };

        /**
         * Swarm sizes, used when creating swarms. Default is MEDIUM.
         */
        GROK.Swarm.SIZE = {
            SMALL: 'small',
            MEDIUM: 'medium',
            LARGE: 'large'
        };

        /**
         * Get the status of a swarm.
         * @param {function(Error, GROK.Swarm)} callback Called with a newly
         * populated GROK.Swarm object with current status.
         */
        GROK.Swarm.prototype.getStatus = function(callback) {
            var parent = this.getScalar('_parent');
            parent.getSwarm(this.getId(), callback);
        };


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK;

        /**
         * @class Represents a logical grouping of {@link GROK.Model}s and
         * {@link GROK.Stream}s. It is simply used as an organizational tool.
         * Functions called on this object will only operate on
         * {@link GROK.Model}s and {@link GROK.Stream}s created within this
         * {@link GROK.Project}.
         *
         * @extends GROK.ApiObject
         *
         * @param {Object} scalars Scalar values to create this project with.
         * @param {Object} options Options passed upwards to GROK.ApiObject.
         */
        GROK.Project = function(scalars, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Project;
        };

        GROK.Project.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Project.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Project.NAMESPACE = 'projects';

        /**
         * Get's a project's name.
         * @return {string} Project name.
         */
        GROK.Project.prototype.getName = function() {
            return this.getScalar('name');
        };

        /**
         * Because a project's description may not be populated at the point it
         * is called, must be given a callback function, which will be called
         * once the library has found the description. An API call may be
         * necessary.
         *
         * @param {function(Error, string)} callback Callback, which will be
         * called with description.
         */
        GROK.Project.prototype.getDescription = function(callback) {
            var me = this,
                existingDescription = this.getAttr('description');
            if (existingDescription) {
                callback(null, existingDescription);
            } else {
                this.populate(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, me.getDetail('description'));
                    }
                });
            }
        };

        /**
         * This will set a new name on the project, making an API call to do so.
         * @param {string} name New name to set.
         * @param {function(Error)} callback Function to be called when API call
         * to set the name is complete. Will send an error object if there is an
         * error.
         */
        GROK.Project.prototype.setName = function(name, callback) {
            this.update({name: name}, callback);
        };

        /**
         * Lists all {@link GROK.Model}s within a project.
         * @param {function(Error, [GROK.Model])} callback Called with
         * {@link GROK.Model}s.
         */
        GROK.Project.prototype.listModels = function(callback) {
            this.listObjects(GROK.Model, callback);
        };

        /**
         * Lists all {@link GROK.Stream}s within a project.
         * @param {function(Error, [GROK.Stream])} callback Called with
         * {@link GROK.Stream}s.
         */
        GROK.Project.prototype.listStreams = function(callback) {
            this.listObjects(GROK.Stream, callback);
        };

        /**
         * Lists all {@link GROK.Action}s within a project.
         * @param {Object} [opts] Options.
         * @param {function(Error, [GROK.Action])} callback Called with
         * {@link GROK.Action}s.
         */
        GROK.Project.prototype.listActions = function(opts /*optional*/, callback) {
            var cb, queryOptions = {};
            if (typeof opts === 'function') {
                cb = opts;
            } else {
                queryOptions = opts;
                cb = callback;
            }
            this.listObjects(GROK.Action, queryOptions, cb);
        };

        /**
         * Creates a new {@link GROK.Model} within a project.
         * @param {object} model Initial state of the model attributes.
         * @param {function(Error, [GROK.Model])} callback Called with new
         * {@link GROK.Model}.
         */
        GROK.Project.prototype.createModel = function(model, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Model, model, callback);
        };

        /**
         * Creates a new {@link GROK.Action} within a project.
         * @param {object} action Initial state of the action attributes.
         * @param {function(Error, [GROK.Action])} callback Called with new
         * {@link GROK.Action}.
         */
        GROK.Project.prototype.createAction = function(action, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Action, action, callback);
        };

        /**
         * Gets an existing {@link GROK.Model}.
         *
         * @param {string} id Model id.
         * @param {function(Error, GROK.Model)} callback Called with retrieved
         * {@link GROK.Model}.
         */
        GROK.Project.prototype.getModel = function(id, callback) {
            var me = this;
            this.getObject(GROK.Model, id, function(err, model) {
                if (err) { return callback(err); }
                model.setScalar('_parent', me);
                callback(null, model);
            });
        };

        /**
         * <p>Similar to {@link GROK.Client#createStream}, creates a new
         * {@link GROK.Stream} inside of this {@link GROK.Project}. You must
         * have a proper stream definition before you can create it
         * properly:</p>
         *
         * <pre class="code">
         *     var streamDef = {
         *         dataSources: [{
         *             name: 'my data source',
         *             dataSourceType: 'local',
         *             fields: [{
         *                 name: 'timestamp',
         *                 dataFormat: {
         *                     dataType: 'DATETIME',
         *                     formatString: 'sdf/yyyy-MM-dd H:m:s.S'
         *                 }
         *             }]
         *         }]
         *     };
         *     project.createStream(streamDef, function(err, stream) {
         *         if (err) { throw err; }
         *         console.log('Stream created with id: ' + stream.getId();
         *     });
         * </pre>
         *
         * @param {object} stream Initial state of the stream attributes.
         * @param {function(Error, [GROK.Stream])} callback Called with new
         * {@link GROK.Stream}.
         */
        GROK.Project.prototype.createStream = function(streamDef, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Stream, streamDef, callback);
        };



/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

var GROK = global.GROK;

/**
 * @class Grok Action object
 * @extends GROK.ApiObject 
 */
GROK.Action = function(attrs, options) {
    GROK.ApiObject.apply(this, arguments);
    this.constructor = GROK.Action;
};

GROK.Action.prototype = GROK.util.heir(GROK.ApiObject.prototype);
GROK.Action.prototype.constructor = GROK.ApiObject;

GROK.Action.NAMESPACE = 'actions';


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK;

        /**
         * @class <p>The main Object for the Grok JS library. All actions start
         * here.</p>
         *
         * <p>The most typical way to create and use the Grok Client:</p>
         *
         * <pre class="code">
         *     var client = new GROK.Client('my-api-key');
         *     client.init(function(err) {
         *         if (! err) {
         *             console.log('You are connected to the Grok API.');
         *         }
         *     });
         * </pre>
         *
         * <p>Now you can use the client to interact with the API.
         *
         * <pre class="code">
         *     client.listProjects(function(err, projects) {
         *         if (err) { throw err; }
         *         console.log('Found ' + projects.length + ' projects.');
         *     });
         * </pre>
         *
         * @extends GROK.ApiObject
         *
         * @param {string} apiKey Users's API key.
         * @param {Object} [options] HTTP options used when making requests to
         * the API through the {@link GROK.Request} object.
         * @param {Object} [options.user] User representation. Should have an id
         * or else it will be ignored. This is used to bypass the init()
         * requirement if necessary.
         */
        GROK.Client = function(apiKey, options) {
            this._validated = false;
            if (! GROK.util.isSet(apiKey)) {
                throw new Error('Cannot create GROK Client without an API ' +
                    'Key:\nnew GROK.Client("my-api-key");');
            }
            options = options || {};
            options.apiKey = apiKey;
            GROK.ApiObject.call(this, {}, options);
            if (options.user && options.user.id) {
                this.setScalars(options.user);
                this._validated = true;
            }
            this.constructor = GROK.Client;
        };

        GROK.Client.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Client.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Client.NAMESPACE = 'users';

        /**
         * <p>Calling this function on a newly created Client object will make
         * an API call to verify the API key given to the Client constructor.
         * You must call this function before using the client object unless
         * you've created the {@link GROK.Client} with a "user" object that
         * contains a valid user id.</p>
         *
         * @param {function(Error, Object} callback Called with the
         * user object retrieved from the API or an error.
         */
        GROK.Client.prototype.init = function(callback) {
            GROK.info('Connecting to Grok...');
            var me = this;
            this.makeRequest({
                method: 'GET',
                path: 'users',
                success: function(resp) {
                    if (! resp || ! resp.users) {
                        callback(new Error('Client cannot understand ' +
                            'response from API at ' + me.getEndpoint() +
                            '. Are you sure this is the proper Grok API URL?'));
                    } else {
                        GROK.info('Connected to Grok.');
                        // there is only one user, YOU!
                        me.setScalars(resp.users[0]);
                        me._validated = true;
                        callback(null);
                    }
                },
                failure: function(error) {
                    if (error.message === 'Unauthorized') {
                        callback(new Error('Invalid API key: "' +
                            me.getApiKey() + '"'));
                    } else {
                        // I don't know about this error, but I'll pass it along
                        // anyways
                        callback(error);
                    }
                }
            });
        };

        /**
         * @private
         */
        GROK.Client.prototype.isValidated = function() {
            return this._validated;
        };

        /**
         * Creates a new project.
         * @param {object} name the project to create.
         * @param {function(Error, GROK.Project)} callback Function to call when
         * {@link GROK.Project} has been created.
         */
        GROK.Client.prototype.createProject = function(project, callback) {
            callback = callback || function () { };
            if (typeof project != "object") {
                project = { name: String(project) };
            }
            this.createObject(GROK.Project, project, callback);
        };

        /**
         * Creates a new model.
         * @param {Object} [model] Model attributes to use when creating.
         * @param {function(Error, GROK.Model)} callback Function to call when
         * {@link GROK.Model} has been created.
         */
        GROK.Client.prototype.createModel = function(model, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Model, model, callback);
        };

        /**
         * <p>Similar to {@link GROK.Project#createStream}, creates a new
         * {@link GROK.Stream} outside of a {@link GROK.Project}. You must have
         * a proper stream definition before you can create it properly:</p>
         *
         * <pre class="code">
         *     def streamDef = {
         *         dataSources: [{
         *             name: 'my data source',
         *             dataSourceType: 'local',
         *             fields: [{
         *                 name: 'timestamp',
         *                 dataFormat: {
         *                     dataType: 'DATETIME',
         *                     formatString: 'sdf/yyyy-MM-dd H:m:s.S'
         *                 }
         *             }]
         *         }]
         *     };
         *     client.createStream(streamDef, function(err, stream) {
         *         if (err) { throw err; }
         *         console.log('Stream created with id: ' + stream.getId();
         *     });
         * </pre>
         *
         * @param {Object} streamDefinition The stream definition, which will be
         * used by the Grok engine to define the stream.
         * @param {function(Error, GROK.Stream)} callback Function to call when
         * {@link GROK.Stream} has been created.
         */
        GROK.Client.prototype.createStream = function(streamDefinition,
                                                      callback) {
            callback = callback || function() {};
            this.createObject(GROK.Stream, streamDefinition, callback);
        };

        /**
         * Gets a stream object
         * @param {string} id Stream id.
         * @param {function(Error, GROK.Stream)} callback Called with retrieved
         * {@link GROK.Stream}.
         */
        GROK.Client.prototype.getStream = function(id, callback) {
            callback = callback || function() {};
            this.getObject(GROK.Stream, id, function(err, stream) {
                if (err && err.message === 'Not Found') {
                    err.message = "Input stream '" + id + "' not found";
                    callback(err);
                } else if (err) {
                    // I don't know about this error, but I'll pass it along
                    // anyways
                    callback(err);
                } else {
                    callback(null, stream);
                }
            });
        };

        /**
         * Gets an existing {@link GROK.Project} by id.
         * @param {string} id Project id.
         * @param {function(Error, GROK.Project)} callback Called with retrieved
         * {@link GROK.Project}.
         */
        GROK.Client.prototype.getProject = function(id, callback) {
            this.getObject(GROK.Project, id, callback);
        };

        /**
         * Gets an existing {@link GROK.Model}.
         *
         * @param {string} id Model id.
         * @param {function(Error, GROK.Model)} callback Called with retrieved
         * {@link GROK.Model}.
         */
        GROK.Client.prototype.getModel = function(id, callback) {
            var me = this;
            this.getObject(GROK.Model, id, function(err, model) {
                if (err) { return callback(err); }
                model.setScalar('_parent', me);
                callback(null, model);
            });
        };

        /**
         * Lists all projects and creates a list of {@link GROK.Project}
         * objects.
         *
         * @param {function(Error, [GROK.Project])} callback Function to be
         * called with the array of {@link GROK.Project} objects.
         */
        GROK.Client.prototype.listProjects = function(callback) {
            this.listObjects(GROK.Project, callback);
        };

        /**
         * <p>When called on the {@link GROK.Client}, this function will return
         * <em>all</em> models for a user, which includes models within all the
         * user's projects as well as those not contained within a
         * {@link GROK.Project}.</p>
         *
         * @param {function(Error, [GROK.Model])} callback Function to be
         * called with the array of {@link GROK.Model} objects.
         */
        GROK.Client.prototype.listModels = function(callback) {
            this.listObjects(GROK.Model, {all: true}, callback);
        };


        /**
         * Lists all projects and creates a list of {@link GROK.Stream} objects.
         *
         * @param {function(Error, [GROK.Stream])} callback Function to be
         * called with the array of {@link GROK.Stream} objects.
         */
        GROK.Client.prototype.listStreams = function(callback) {
            this.listObjects(GROK.Stream, callback);
        };


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK,
            // default poll interval is to start at 3s, then double until 5m is
            // reached
            DEFAULT_POLL_INTERVAL = [3000, 3000000],
            // wait this many seconds after seeing no new data before giving up
            DEFAULT_TIMEOUT = 60,
            // default increment function doubles increment
            DEFAULT_POLL_INCREMENT = function(i) { return i * 2; },
            ROW_ID = 'ROWID',
            ANY = 'any';

        function findIndex(obj, iterator, context) {
            var result;
            Array.prototype.some.call(obj, function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    result = index;
                    return true;
                }
            });
            return result;
        }

        function extractLastRowId(output) {
            return output.data[output.data.length - 1][output.names.indexOf(ROW_ID)];
        }

        function Monitor(poller, opts) {
            opts = opts || {};
            this._poller = poller;
            if (typeof opts.interval === 'undefined') {
                this._interval = DEFAULT_POLL_INTERVAL;
            } else if (typeof opts.interval === 'number') {
                // if interval is a number, assume it is the min value, and make the
                // max value 10x that number of ms
                this._interval = [opts.interval, (opts.interval * 10)];
            } else {
                this._interval = opts.interval;
            }
            this._increment = opts.increment || DEFAULT_POLL_INCREMENT;
            this._timeout = opts.timeout || DEFAULT_TIMEOUT;
            this._currentInterval = this._interval[0];
            this._debug = opts.debug;
            this._pollIntervalId = -1;
            this._pollListeners = [];
            this._doneListeners = [];
            this._errorListeners = [];
            this._done = false;
        }

        Monitor.prototype.onPoll = function(fn) {
            this._pollListeners.push(fn);
            return this;
        };

        Monitor.prototype.onDone = function(fn) {
            this._doneListeners.push(fn);
            return this;
        };

        Monitor.prototype.onError = function(fn) {
            this._errorListeners.push(fn);
            return this;
        };

        Monitor.prototype._fire = function(evt, payload) {
            var count = 0;
            if (evt === 'done') {
                this._done = true;
            }
            this['_' + evt + 'Listeners'].forEach(function(listener) {
                count++;
                listener(payload);
            });
            this._print('Monitor called ' + count + ' ' + evt + ' listeners');
        };

        Monitor.prototype.start = function() {
            this._startTime = new Date().getTime();
            this._print('Monitor starting');
            this._pollAt(this._currentInterval);
            return this;
        };

        Monitor.prototype._pollAt = function(interval) {
            var me = this,
                activePoll = false;

            // clear out existing poll interval
            if (this._pollIntervalId) {
                clearInterval(this._pollIntervalId);
            }
            me._print('Polling at ' + interval);
            this._pollIntervalId = setInterval(function() {
                // ignore if there is already a poll request pending
                if (activePoll) {
                    return;
                }
                if (me._done) {
                    clearInterval(me._pollIntervalId);
                    return;
                }
                activePoll = true;
                me._print('Monitor polling...');
                me._poller(function(pollResult, newDataReceived) {
                    me._print('Monitor received poll result');
//                    me._print(pollResult);
                    me._print('new data recieved? ' + new Boolean(newDataReceived));
                    if (! newDataReceived) {
                        // no new data was received, so increment the polling
                        // interval. This will kill the current interval and
                        // restart it. But we'll only increment the interval if
                        // we are not already at the max interval value
                        if (me._currentInterval !== me._interval[1]) {
                            me._currentInterval = Math.min(
                                me._increment(me._currentInterval),
                                me._interval[1]
                            );
                            me._pollAt(me._currentInterval);
                        }
                    } else {
                        // if our current interval is not the minimum interval,
                        // reset it to the minimum because we're getting data
                        // once again
                        if (me._currentInterval !== me._interval[0]) {
                            me._currentInterval = me._interval[0];
                            me._print('Resetting poll interval to ' + me._currentInterval);
                            me._pollAt(me._currentInterval);
                        }
                    }
                    // could have completed since poller was called
                    if (! me._done) {
                        me._fire('poll', pollResult);
                    }
                    activePoll = false;
                });
            }, interval);
        };

        Monitor.prototype.check = function () {
            var me = this;
            me._poller(function () { });
        }

        Monitor.prototype.stop = function() {
            var duration = new Date().getTime() - this._startTime;
            this._print('Monitor stopping');
            clearInterval(this._pollIntervalId);
            this._fire('done', duration);
            return duration;
        };

        Monitor.prototype._print = function(msg) {
            if (this._debug) {
                console.log(msg);
            }
        };

        function SwarmMonitor(swarm, opts) {
            this._swarm = swarm;
            this._lastStatus = undefined;
            this._statusChangeListeners = [];
            Monitor.call(this, this._swarmPoller, opts);
        }

        SwarmMonitor.prototype = GROK.util.heir(Monitor.prototype);
        SwarmMonitor.prototype.constructor = Monitor;

        SwarmMonitor.prototype._swarmPoller = function(cb) {
            var me = this;
            this._print('polling for swarm...');
            this._swarm.getStatus(function(err, swarm) {
                if (err) {
                    return me._fire('error', err);
                }
                var status = swarm.get('status');
                me._print('swarm status: ' + status);
                if (status !== me._lastStatus) {
                    // for the statusChange listeners
                    me.statusChange(swarm);
                }
                me._lastStatus = status;
                // for the onPoll listeners
                cb(swarm);
                if (status === GROK.Swarm.STATUS.COMPLETED) {
                    me.stop();
                }
            });
        };

        SwarmMonitor.prototype.onStatusChange = function(fn) {
            this._statusChangeListeners.push({trigger: ANY, fn: fn});
        };

        SwarmMonitor.prototype.onStatus = function(status, fn) {
            this._statusChangeListeners.push({trigger: status, fn: fn});
        };

        SwarmMonitor.prototype.statusChange = function(swarm) {
            this._print('SwarmMonitor calling statusChange listeners');
            this._statusChangeListeners.forEach(function(listener) {
                var trigger = listener.trigger,
                    fn = listener.fn;
                if (trigger === ANY || trigger === swarm.get('status')) {
                    fn(swarm);
                }
            });
        };

        function PredictionMonitor(model, opts) {
            opts = opts || {};
            this._getOutputDataOpts = opts.outputDataOptions || {
                limit: 100,
                shift: true,
            };
            this._model = model;
            this._dataListeners = [];
            this._lastRowIdSeen = opts.lastRowIdSeen || -1;
            Monitor.call(this, this._outputPoller, opts);
        }

        PredictionMonitor.prototype = GROK.util.heir(Monitor.prototype);
        PredictionMonitor.prototype.constructor = Monitor;

        PredictionMonitor.prototype._outputPoller = function(cb) {
            var me = this;
            this._print('polling for new model output...');
            me._getOutputDataOpts.startAt = this._lastRowIdSeen + 1;
            this._model.getOutputData(me._getOutputDataOpts, function(err, output) {
                var newDataExists = false,
                    unprocessedData,
                    // grabbing this value here, because it gets set in
                    // _processOutputData below, and I need to use it before it changes.
                    lastRowIdSeen = me._lastRowIdSeen;
                if (err) {
                    me._print(err);
                    return me._fire('error', err);
                }
                // replace the data part of the output with what we think is
                // non-overlapping data, but first save a reference to the
                // unprocessed data
                unprocessedData = output.data.slice(0, output.data.length);
                output.data = me._processOutputData(output.data, output.meta);
                if (output.data.length &&
                        lastRowIdSeen !== extractLastRowId(output)) {
                    newDataExists = true;
                    me._lastNewDataTime = new Date();
                }
                // for the onData listeners
                me._data(output, unprocessedData);
                me._lastPollTime = new Date().getTime();
                // for the onPoll listeners
                cb(output, newDataExists);

            });
        };

        PredictionMonitor.prototype.onData = function(fn) {
            this._dataListeners.push(fn);
        };

        PredictionMonitor.prototype._data = function(chunk, unProcessedChunk) {
            this._print('notifying ' + this._dataListeners.length + ' listener of new data');
            this._dataListeners.forEach(function(listener) {
                listener(chunk, unProcessedChunk);
            });
        };

        PredictionMonitor.prototype._processOutputData = function(data, meta) {
            var me = this,
                startAt,
                result,
                secondsSinceLastNewData,
                dataOnly = data,
                firstOutputRowId,
                lastOutputRowId;
            if (dataOnly.length === 0 || dataOnly[0].length === 0) {
                // return [] for empty output data
                return [];
            }
            firstOutputRowId = dataOnly[0][0];
            // second to last, actually, because the very last row has no ROWID, 
            // and it only contains the last prediction value for this set
            lastOutputRowId = dataOnly[dataOnly.length - 2][0];
            if (this._lastRowIdSeen === -1) {
                result = dataOnly;
            } else {
                if (firstOutputRowId < this._lastRowIdSeen) {
                    // overlap
                    startAt = findIndex(dataOnly, function(row) {
                        return row[0] === me._lastRowIdSeen + 1;
                    });
                    if (! startAt) {
                        // When there is no startAt, that means the data entirely
                        // overlaps our current data and there is nothing new to
                        // display.
                        result = [];
                    } else {
                        result = dataOnly.slice(startAt);
                    }
                } else if (firstOutputRowId === this._lastRowIdSeen + 1) {
                    // perfect
                    result = dataOnly;
                } else {
                    // gap
                    me._print('data gap');
                    me._fire('error', new Error('There was a data gap while retrieving predictions from the API.'));
                    result = dataOnly;
                }
            }

            if (this._lastRowIdSeen === lastOutputRowId) {
                secondsSinceLastNewData = (new Date().getTime() - this._lastNewDataTime) / 1000;
                if (meta.modelStatus !== 'swarming' && secondsSinceLastNewData > this._timeout) {
                    // do not stop monitoring until model is done swarming and
                    // we're past the timeout
                    this._print('timeout');
                    this.stop();
                }
            }

            this._lastRowIdSeen = lastOutputRowId;
            return result;
        };

        GROK.Monitor = Monitor;

        /**
         * This is a utility class meant to poll the API for swarm results and
         * allow listeners to get updated when the swarm changes states.
         * @type {Function}
         */
        GROK.SwarmMonitor = SwarmMonitor;

        /**
         * This is a utility class meant to poll the API for prediction results
         * and allow listeners to get updated when predictions flow in.
         * @type {Function}
         */
        GROK.PredictionMonitor = PredictionMonitor;


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
// jXHR.js (JSON-P XHR)
// v0.1 (c) Kyle Simpson
// MIT License

// slightly modified by Matthew Taylor to run within GROKB

(function(global){
	var SETTIMEOUT = global.setTimeout, // for better compression
		doc = global.document,
		callback_counter = 0;
		
	global.jXHR = function() {
		var script_url,
			script_loaded,
			scriptElem,
			publicAPI = null;
			
		function removeScript() { try { scriptElem.parentNode.removeChild(scriptElem); } catch (err) { } }
			
		function reset() {
			script_loaded = false;
			script_url = "";
			removeScript();
			scriptElem = null;
			fireReadyStateChange(0);
		}
		
		function ThrowError(msg) {
			try { publicAPI.onerror.call(publicAPI,msg,script_url); } catch (err) { throw new Error(msg); }
		}

		function handleScriptLoad() {
			if ((this.readyState && this.readyState!=="complete" && this.readyState!=="loaded") || script_loaded) { return; }
			this.onload = this.onreadystatechange = null; // prevent memory leak
			script_loaded = true;
			if (publicAPI.readyState !== 4) ThrowError("Script failed to load ["+script_url+"].");
			removeScript();
		}
		
		function fireReadyStateChange(rs,args) {
			args = args || [];
			publicAPI.readyState = rs;
			if (typeof publicAPI.onreadystatechange === "function") publicAPI.onreadystatechange.apply(publicAPI,args);
		}
				
		publicAPI = {
			onerror:null,
			onreadystatechange:null,
			readyState:0,
			open:function(method,url){
				reset();
				internal_callback = "cb"+(callback_counter++);
				(function(icb){
					global.jXHR[icb] = function() {
						try { fireReadyStateChange.call(publicAPI,4,arguments); } 
						catch(err) { 
							publicAPI.readyState = -1;
							ThrowError("Script failed to run ["+script_url+"]."); 
						}
						global.jXHR[icb] = null;
					};
				})(internal_callback);
				script_url = url.replace(/=\?/,"=jXHR."+internal_callback);
				fireReadyStateChange(1);
			},
			send:function(){
				SETTIMEOUT(function(){
					scriptElem = doc.createElement("script");
					scriptElem.setAttribute("type","text/javascript");
					scriptElem.onload = scriptElem.onreadystatechange = function(){handleScriptLoad.call(scriptElem);};
					scriptElem.setAttribute("src",script_url);
					doc.getElementsByTagName("head")[0].appendChild(scriptElem);
				},0);
				fireReadyStateChange(2);
			},
			setRequestHeader:function(){}, // noop
			getResponseHeader:function(){return "";}, // basically noop
			getAllResponseHeaders:function(){return [];} // ditto
		};

		reset();
		
		return publicAPI;
	};
})(window);
