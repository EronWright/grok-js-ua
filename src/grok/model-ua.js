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
         * Grok Model, used to contain a GROK.Stream object and swarm against
         * it, eventually producting predictions on the stream.
         * @constructor
         * @param {Object} attrs Values to create this project with.
         * @param {Object} options Options passed upwards to GROK.ApiObject.
         */
        GROK.Model = function(attrs, options) {
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
            return this.getScalar('name');
        };

        /**
         * Update this model object with new properties.
         * @param {object} props The new properties to update.
         * @param {function(Error)} callback Called when done.
         */
        GROK.Model.prototype.update = function(props, callback) {
            this.updateObject(GROK.Model, props, callback);
        };

        /**
         * Clones this model into a new model instance.
         * @param {function(Error, GROK.Model} callback Called with cloned
         * model.
         */
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

        /**
         * Returns predictions.
         * @param {function(Error, Object} callback Called with output data.
         */
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

        /**
         * Lists all the swarms run against this model's stream.
         * @param {function(Error, [GROK.Swarm]} callback Called with list of
         * swarm objects.
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
         * Starts a new swarm against the model.
         * @param {function(Error, GROK.Swarm} callback Called with new swarm
         * object.
         */
        GROK.Model.prototype.startSwarm = function(callback) {
            this.makeRequest({
                method: 'POST',
                url: this.get('swarmsUrl'),
                success: function(data) {
                    callback(null, new GROK.Swarm(data.swarm));
                },
                failure: function(err) {
                    callback(err);
                }
            });
        };

        /**
         * Sends a command to the API to stop swarming. The command is sent to
         * the API, but it could take time for the Grok engine to actually stop
         * the swarm.
         * @param {function(Error} callback Called when command has been sent.
         */
        GROK.Model.prototype.stopSwarm = function(callback) {
            this.makeRequest({
                method: 'POST',
                url: this.get('commandsUrl'),
                data: {
                    command: 'stop'
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
         * Gets a Swarm object.
         * @param {string} swarmId Swarm id.
         * @param {function(Error, GROK.Swarm} callback Called with Swarm.
         */
        GROK.Model.prototype.getSwarm = function(swarmId, callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('swarmsUrl') + '/' + swarmId,
                success: function(data) {
                    callback(null, new GROK.Swarm(data.swarm));
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


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
