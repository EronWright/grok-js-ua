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
                                opts.failure(new Error('Could not parse ' +
                                    'response text from API server: ' +
                                    this.responseText));
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
