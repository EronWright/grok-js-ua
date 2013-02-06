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
         * @param {function(Error, [GROK.Action])} callback Called with
         * {@link GROK.Action}s.
         */
        GROK.Project.prototype.listActions = function(callback) {
            this.listObjects(GROK.Action, callback);
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
