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
         * Deletes this object through the API. Once this has occurred, you
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
                instanceHeaders = GROK.util.shallowObjectClone(
                    this._httpHeaders
                );

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
            new global.GROK.Request({
                endpoint: this.getEndpoint(),
                version: this.getVersion(),
                apiKey: this.getApiKey(),
                proxyEndpoint: this.getProxyEndpoint()
            }).send(options);
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
        GROK.ApiObject.prototype.setDetails = function(details) {
            this._details = details;
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
                success: function(resp) {
                    callback(null,
                        new ApiSubclass(resp[singularNamespace],
                            me._getDefaultChildOptions()
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


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
