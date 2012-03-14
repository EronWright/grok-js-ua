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

        /**
         * Lists all models within a project.
         * @param {function(Error, [GROK.Model])} callback Called with models.
         */
        GROK.Project.prototype.listModels = function(callback) {
            this.listObjects(GROK.Model, callback);
        };

        /**
         * Lists all streams within a project.
         * @param {function(Error, [GROK.Stream])} callback Called with streams.
         */
        GROK.Project.prototype.listStreams = function(callback) {
            this.listObjects(GROK.Stream, callback);
        };

        /**
         * Creates a new model within a project.
         * @param {object} model Initial state of the model attributes.
         * @param {function(Error, [GROK.Model])} callback Called with new
         * model.
         */
        GROK.Project.prototype.createModel = function(model, callback) {
            callback = callback || function() {};
            this.createObject(GROK.Model, model, callback);
        };

        /**
         * Creates a new stream within a project.
         * @param {object} stream Initial state of the stream attributes.
         * @param {function(Error, [GROK.Stream])} callback Called with new
         * stream.
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
