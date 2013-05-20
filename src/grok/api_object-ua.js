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
                ENDPOINT: 'https://api.numenta.com/',
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
         * @param {string} [options.endpoint='https://api.numenta.com/'] URL
         * to make the request to.
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
