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

            PROMOTION_INTERVAL = 500;

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

        GROK.Model.prototype.getStream = function(callback) {
            var streamId = this.get('streamId'),
                parent = this.get('_parent');
            parent.getStream(streamId, callback);
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
            var me = this;
            this.makeRequest({
                method: 'POST',
                url: this.get('swarmsUrl'),
                success: function(data) {
                    var swarmAttrs = data.swarm;
                    // add this model as the swarm's parent
                    swarmAttrs._parent = me;
                    callback(null, new GROK.Swarm(swarmAttrs));
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
        
        GROK.Model.prototype.alignOutputData = function(output) {
            var headers = output.names,
                data = output.data,
                emptyRow = [],
                i,
                newRow,
                fields,
                predictionIndices = [];
                
            headers.forEach(function(name, i) {
                if (name.match('Metric temporal') || name.match('Predicted')) {
                    predictionIndices.push(i);
                }
            });
            
            // add empty row at end of data to hold the last prediction(s)
            data[0].forEach(function() {
                emptyRow.push('');
            });
            data.push(emptyRow);
            // bump all predicitons down one (counting down)
            for (i = data.length - 1; i >= 0; i--) {
                fields = data[i];
                newRow = []
                if (i !== data.length - 1) {
                    predictionIndices.forEach(function(predictionIndex) {
                        var predictionValue = fields[predictionIndex];
                        // put the prediction value into the same column, but one level down
                        data[i + 1][predictionIndex] = predictionValue;
                        // if this is the first row, we clear out the prediction values
                        if (i === 0) {
                            data[i][predictionIndex] = '';
                        }
                    });
                }
            }
            // put the header row at the top
            data.unshift(headers);
            return data;
        };

        GROK.Model.prototype.promote = function(callback) {
            var me = this,
                initialOutputLength;

            function whenRunning() {
                var callbackCalled,
                    passedCacheInterval = setInterval(function() {
                        me.getOutputData(function(err, outputData) {
                            if (err) { return callback(err); }

                            if (!callbackCalled && outputData.data.length >= initialOutputLength) {
                                clearInterval(passedCacheInterval);
                                // we are done!!
                                callback();
                                callbackCalled = true;
                            }
                        });
                    }, PROMOTION_INTERVAL);
            }

            function afterPromotion() {
                me.getOutputData(function(err, outputData) {
                    var runningInterval;

                    if (err) { return callback(err); }

                    initialOutputLength = outputData.data.length;

                    runningInterval = setInterval(function() {
                        me.populate(function(err, modelDetails) {
                            if (err) { return callback(err); }
                            // TODO: The fact that I need to go to the modelDetails return values is a bug.
                            // I should be able to do:
                            //  me.get('status') and it should be up to date, but for some reason it is not.
                            if (modelDetails.status === 'running') {
                                clearInterval(runningInterval);
                                whenRunning();
                            }
                        });
                    }, PROMOTION_INTERVAL);

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
