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
         * Calling this function on a newly created Client object will make an
         * API call to verify the API key given to the Client constructor.
         * @param {function(Error, Object} callback Called with the
         * user object retrieved from the API or an error.
         */
        GROK.Client.prototype.init = function(callback) {
            var me = this;
            this.makeRequest({
                method: 'GET',
                path: 'users',
                success: function(resp) {
                    if (! resp.users) {
                        callback(new Error('Client cannot understand ' +
                            'response from API at ' + me.getEndpoint() +
                            '. Are you sure this is the proper Grok API URL?'));
                    } else {
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
                        callback(err);
                    }
                }
            });
        };

//        // TODO: test this once the API supports it.
//        GROK.Client.prototype.showServices = function(callback) {
//            this.makeRequest({
//                path: 'services',
//                success: function(resp) {
//                    callback(null, resp);
//                },
//                failure: function(err) {
//                    callback(err);
//                }
//            });
//        };
//
//        // TODO: test this once the API supports it.
//        GROK.Client.prototype.systemStatus = function(callback) {
//            this.makeRequest({
//                path: 'admin',
//                success: function(resp) {
//                    callback(null, resp);
//                },
//                failure: function(err) {
//                    callback(err);
//                }
//            });
//        };

        /**
         * @private
         */
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

        /**
         * Creates a new stream.
         * @param {Object} streamDefinition The stream definition, which will be
         * used by the Grok engine to define the stream.
         * @param {function(Error, GROK.Stream)} callback Callback.
         */
        GROK.Client.prototype.createStream = function(streamDefinition,
                                                      callback) {
            callback = callback || function() {};
            this.createObject(GROK.Stream, streamDefinition, callback);
        };

        /**
         * Creates a new model.
         * @param {Object} [model] Model attributes to use when creating.
         * @param {function(Error, GROK.Model)} callback Callback.
         */
        GROK.Client.prototype.createModel = function(model, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Model, model, callback);
        };

        /**
         * Gets an existing project
         * @param {string} id Project id.
         * @param {function(Error, GROK.Project)} callback Function called with
         * project.
         */
        GROK.Client.prototype.getProject = function(id, callback) {
            this.getObject(GROK.Project, id, callback);
        };

        /**
         * Lists all projects and creates a list of GROK.Project objects.
         * @param {function(Error, [GROK.Project])} callback Function to be
         * called with the array of Project objects.
         */
        GROK.Client.prototype.listProjects = function(callback) {
            this.listObjects(GROK.Project, callback);
        };

        /**
         * Lists all projects and creates a list of GROK.Model objects.
         * @param {function(Error, [GROK.Model])} callback Function to be
         * called with the array of Model objects.
         */
        GROK.Client.prototype.listModels = function(callback) {
            this.listObjects(GROK.Model, {all: true}, callback);
        };


        /**
         * Lists all projects and creates a list of GROK.Stream objects.
         * @param {function(Error, [GROK.Stream])} callback Function to be
         * called with the array of Stream objects.
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
