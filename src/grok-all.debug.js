
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

        /**
         * The Grok global namespace
         * @memberOf global
         * @type {!Object}
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
                var responseData;
                if (this.readyState == 4 && this.status == 200) {
                    // it's all good
                    if (opts.success) {
                        if (this.responseText) {
                            try {
                                responseData = JSON.parse(this.responseText);
                            } catch (e) {
                                opts.failure(new Error('Could not parse response text from API server: '
                                    + this.responseText));
                            }
                            if (responseData.errors) {
                                opts.failure(new Error(responseData.errors[0]));
                            } else {
                                opts.success(responseData);
                            }
                        } else {
                            opts.success();
                        }
                    }
                } else if (this.readyState == 4 && this.status != 200) {
                    // error from the server
                    if (opts.failure) {
                        opts.failure(
                            new Error('There was an XHR error, status is: ' +
                                this.status)
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

            // TODO: On server side, keep a whitelist of API domains.

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
         * @param {string} [options.apiKey] API Key. May not be necessary if all calls
         * are proxied through local server and that server has an API key.
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
                ENDPOINT: 'http://grok-api.numenta.com/',
                VERSION: 'v1',
                FORCE_PROXY: false
            };

        /**
         * This is the base class for all objects returned from the GROK API. It
         * defines concepts such as "details" and "scalars". Because all API
         * objects initially come from a collection of objects (usually), they
         * are only populated with some basic scalar values (like 'id' and
         * 'name). Any time users need more information about that object
         * instance, they need to make another API call to get more details
         * about that object.
         *
         * Those initial scalar values are referred to as 'scalars' within this
         * GROK.ApiObject. Any more details retrieved from the API server and
         * added to the object are referred to as 'details'.
         *
         * Used as a super class for any GROK objects that need to talk to the
         * API to do certain things. Provides easy way to make request to API.
         *
         * @private
         * @constructor
         * @param {Object} scalars The scalar values for this API Object
         * initially retrieved from the API server.
         * @param {Object} options Options used for making calls to the API
         * server.
         * @param {string} [options.endpoint='http://grok-api.numenta.com/'] URL
         * to make the request to.
         * @params {string} [options.proxyEndpoint='/grok'] When API proxy calls
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
            this.setEndpoint(options.endpoint || DEFAULT.ENDPOINT);
            this.setProxyEndpoint(options.proxyEndpoint);
            this.setVersion(options.version || DEFAULT.VERSION);
            this.setHeaders(options.httpHeaders || {});
            this.setUserId(options.userId);
            this.setApiKey(options.apiKey);
        };

        /**
         * When switched to true, all requests will go through the local server
         * proxy, even when they could be accomplished with JSONP.
         *
         * @static
         * @default false
         */
        GROK.ApiObject.FORCE_PROXY = DEFAULT.FORCE_PROXY;

        /**
         * Sets one scalar value.
         * @param {string} key Key.
         * @param {Object} value The value to set, could be anything.
         */
        GROK.ApiObject.prototype.setScalar = function(key, value) {
            this._scalars[key] = value;
        };

        /**
         * Sets all scalar values.
         * @param {Object} scalars All scalars to set.
         * @param {Boolean} [clobber=true] Override all scalars?
         */
        GROK.ApiObject.prototype.setScalars = function(scalars, clobber) {
            var name;
            if (typeof clobber === 'undefined') {
                clobber = true;
            }
            if (clobber) {
                this._scalars = scalars;
            } else {
                for (name in scalars) {
                    this._scalars[name] = scalars[name];
                }
            }
        };

        /**
         * Gets all scalar values.
         * @return {Object} All scalar values.
         */
        GROK.ApiObject.prototype.getScalars = function() {
            return this._scalars || {};
        };

        /**
         * Gets one scalar value by name.
         * @param {string} name Name of scalar to get.
         * @return {Object} Scalar value of name.
         */
        GROK.ApiObject.prototype.getScalar = function(name) {
            return this._scalars[name];
        };

        /**
         * Sets all details.
         * @param {Object} details All details to set.
         */
        GROK.ApiObject.prototype.setDetails = function(details) {
            this._details = details;
        };

        GROK.ApiObject.prototype.setDetail = function(name, value) {
            this._details[name] = value;
        };

        /**
         * Gets all details.
         * @return {Object} All details.
         */
        GROK.ApiObject.prototype.getDetails = function() {
            return this._details || {};
        };

        /**
         * Gets one detail value.
         * @param {string} name Name of detail.
         * @return {Object} Value of detail.
         */
        GROK.ApiObject.prototype.getDetail = function(name) {
            return this._details[name];
        };

        /**
         * Specifies whether this objects details have been retrieved from the
         * API server yet, and whether they are available locally.
         * @return {boolean} True if details are set locally.
         */
        GROK.ApiObject.prototype.hasDetails = function() {
            return GROK.util.isSet(this._details);
        };

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
         * Gets one attribute, whether it is scalar or details.
         * @param {string} name Name of the attribute.
         * @return {Object} Whatever is requested.
         */
        GROK.ApiObject.prototype.getAttr = function(name) {
            return this.getAttrs()[name];
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
         * Gets the object's id.
         * @return {string} The object id.
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
         * Sets user id.
         * @param {string} userId User Id.
         */
        GROK.ApiObject.prototype.setUserId = function(userId) {
            this._userId = userId;
        };
        /**
         * Gets uper id.
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
         * Deletes this project through the API. Once this has occurred, you
         * should seriously just de-reference this object. It is useless to you.
         * @param {function(Error)} callback Function to be called when delete
         * has completed.
         */
        GROK.ApiObject.prototype.delete = function(callback) {
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

            GROK.info('GROK.ApiObject.makeRequest for '
                + this.constructor.NAMESPACE);
            GROK.debug(options);

            var name,
                error,
                instanceHeaders = GROK.util.shallowObjectClone(
                    this._httpHeaders
                );

            // we cannot process this request if both "url" and "path" are
            // missing
            if (! options.url && ! options.path) {
                error = new Error('Cannot make request without an absolute "url" or relative "path".');
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
            new global.GROK.Request({
                endpoint: this.getEndpoint(),
                version: this.getVersion(),
                apiKey: this.getApiKey(),
                proxyEndpoint: this.getProxyEndpoint()
            }).send(options);
        };

        /**
         * Used by subclasses of ApiObject to list things.
         * @private
         */
        GROK.ApiObject.prototype.listObjects = function() {

            GROK.debug('GROK.ApiObject.listObjects for '
                + this.constructor.NAMESPACE);

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
                            me.getDefaultChildOptions()
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
         * Used by subclasses of ApiObject to create things.
         * @private
         */
        GROK.ApiObject.prototype.createObject = function(ApiSubclass,
                                                         objectProperties,
                                                         callback) {

            GROK.debug('GROK.ApiObject.createObject for '
                + this.constructor.NAMESPACE);

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
                        me.getDefaultChildOptions()
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
         * @param ApiSubclass
         * @param id
         * @param callback
         */
        GROK.ApiObject.prototype.getObject = function(ApiSubclass,
                                                      id,
                                                      callback) {

            GROK.debug('GROK.ApiObject.getObject for '
                + this.constructor.NAMESPACE);

            var me = this,
                namespace = ApiSubclass.NAMESPACE,
                singularNamespace = namespace.substr(0, namespace.length - 1);
            this.makeRequest({
                method: 'GET',
                url: this.get(namespace + 'Url') + '/' + id,
                success: function(resp) {
                    callback(null,
                        new ApiSubclass(resp[singularNamespace],
                            me.getDefaultChildOptions()
                        )
                    );
                },
                failure: function(error) {
                    callback(error);
                }
            });
        };

        GROK.ApiObject.prototype.updateObject = function(ApiSubclass,
                                                         updatedProps,
                                                         callback) {

            GROK.debug('GROK.ApiObject.updateObject for '
                + this.constructor.NAMESPACE);

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
                    me.setScalars(updateObject, false);
                    callback();
                },
                failure: function(error) {
                    callback(error);
                }
            });
        };

        GROK.ApiObject.prototype.getDefaultChildOptions = function() {
            return {
                endpoint: this.getEndpoint(),
                proxyEndpoint: this.getProxyEndpoint(),
                version: this.getVersion(),
                headers: this.getHeaders(),
                userId: this.getUserId(),
                apiKey: this.getApiKey()
            };
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

        GROK.Stream = function(scalars, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Stream;
        };

        GROK.Stream.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Stream.prototype.constructor = GROK.ApiObject;

        /**
         * The namespace of this class of GROK objects.
         * @static
         */
        GROK.Stream.NAMESPACE = 'streams';

        GROK.Stream.prototype.populate = function(callback) {
            this.expand(GROK.Stream, callback);
        };

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
            })
        };

        GROK.Stream.prototype.getInputData = function(callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('dataUrl'),
                success: function(resp) {
                    callback(null, resp.data);
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
         * Grok Model
         * @constructor
         *
         * @param {Object} scalars Scalar values to create this project with.
         * @param {Object} options Options passed upwards to GROK.ApiObject.
         */
        GROK.Model = function(scalars, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Model;
        };

        GROK.Model.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Model.prototype.constructor = GROK.ApiObject;

        GROK.Model.NAMESPACE = 'models';

        /**
         * @return {string} model name.
         */
        GROK.Model.prototype.getName = function() {
            return this.getScalar('name');
        };

        GROK.Model.prototype.populate = function(callback) {
            this.expand(GROK.Model, callback);
        };

        GROK.Model.prototype.update = function(props, callback) {
            this.updateObject(GROK.Model, props, callback);
        };

        GROK.Model.prototype.clone = function(callback) {
            var me = this,
                parent = this.getScalar('_parent'),
                myAttrs = this.getAttrs();
            // before cloning, we need to go get all the model details from the
            // API if we have not already
            if (! this.hasDetails()) {
                this.populate(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        myAttrs = me.getAttrs();
                    }
                });
            }
            // the 'aggregation' comes back from the API as null, but should be
            // an object
            // TODO: remove this when http://tracker:8080/browse/GRK-888 and
            // http://tracker:8080/browse/GRK-889 are fixed
            if (! myAttrs.aggregation) {
                myAttrs.aggregation = {
                    interval: 'seconds'
                };
            }
            parent.createModel(myAttrs, callback);
        };

        GROK.Model.prototype.getOutputData = function(callback) {
            this.makeRequest({
                url: this.get('dataUrl'),
                success: function(data) {
                    callback(null, data.output);
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

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
         * Grok Project
         * @constructor
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
         * The namespace of this class of GROK objects.
         * @static
         */
        GROK.Project.NAMESPACE = 'projects';

        /**
         * @return {string} project id.
         */
        GROK.Project.prototype.getId = function() {
            return this.getScalar('id');
        };

        /**
         * @return {string} project name.
         */
        GROK.Project.prototype.getName = function() {
            return this.getScalar('name');
        };

        /**
         * This might cause a REST call, so it is async.
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

        GROK.Project.prototype.update = function(props, callback) {
            this.updateObject(GROK.Project, props, callback);
        };

        GROK.Project.prototype.listModels = function(callback) {
            this.listObjects(GROK.Model, callback);
        };

        GROK.Project.prototype.listStreams = function(callback) {
            this.listObjects(GROK.Stream, callback);
        };

        GROK.Project.prototype.createModel = function(model, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Model, model, callback);
        };

        GROK.Project.prototype.createStream = function(streamDef, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Stream, streamDef, callback);
        };

        GROK.Project.prototype.populate = function(callback) {
            this.expand(GROK.Project, callback);
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
         * The main Object for the Grok JS library. All actions start here. If
         * the "options" contain an "endpoint" or "version", these are
         * passed into the GROK.Requestor superclass.
         *
         * @constructor
         * @augments GROK.ApiObject
         *
         * @param {string} apiKey Users's API key.
         * @param {Object} [options] HTTP options, passed into
         * GROK.Requestor super class.
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
         * The namespace of this class of GROK objects.
         * @static
         */
        GROK.Client.NAMESPACE = 'users';

        GROK.Client.prototype.init = function(callback) {
            var me = this;
            this.makeRequest({
                method: 'GET',
                path: 'users',
                success: function(resp) {
                    // there is only one user, YOU!
                    me.setScalars(resp.users[0]);
                    me._validated = true;
                    callback(null);
                },
                failure: function(error) {
                    if (error.message === 'Unauthorized') {
                        callback(new Error('Invalid API key: "' + me.getApiKey() + '"'));
                    } else {
                        // I don't know about this error
                        throw error;
                    }
                }
            });
        };

        // TODO: test this once the API supports it.
        GROK.Client.prototype.showServices = function(callback) {
            this.makeRequest({
                path: 'services',
                success: function(resp) {
                    callback(null, resp);
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        // TODO: test this once the API supports it.
        GROK.Client.prototype.systemStatus = function(callback) {
            this.makeRequest({
                path: 'admin',
                success: function(resp) {
                    callback(null, resp);
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        GROK.Client.prototype.isValidated = function() {
            return this._validated;
        };

        /**
         * Creates a new project.
         * @param {string} name Name of the project to create.
         * @param {function(Error, GROK.Project)} callback Function to call when
         * project has been created.
         */
        GROK.Client.prototype.createProject = function(name, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Project, {name: name}, callback);
        };

        GROK.Client.prototype.createStream = function(streamDefinition, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Stream, streamDefinition, callback);
        };

        GROK.Client.prototype.createModel = function(model, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Model, model, callback);
        };

        /**
         * Gets an existing project
         * @param {string} id project id.
         * @param {function} callback Function called with project.
         */
        GROK.Client.prototype.getProject = function(id, callback) {
            this.getObject(GROK.Project, id, callback);
        };

        /**
         * Lists all projects and creates a list of GROK.Project objects.
         * @param {function(Error, [GROK.Project]} callback Function to be
         * called with the array of Project objects.
         */
        GROK.Client.prototype.listProjects = function(callback) {
            this.listObjects(GROK.Project, callback);
        };

        GROK.Client.prototype.listModels = function(callback) {
            this.listObjects(GROK.Model, {all: true}, callback);
        };

        GROK.Client.prototype.listStreams = function(callback) {
            this.listObjects(GROK.Stream, callback);
        };


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
