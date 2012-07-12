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
         * @param {function(Error, Object, Object} callback Called with output
         * data and meta information about the data.
         */
        GROK.Model.prototype.getOutputData = function(opts/*optional*/, callback) {
            var me = this, cb, limit, shift;
            if (typeof opts === 'function') {
                cb = opts;
            } else {
                limit = opts.limit || 1000;
                shift = opts.shift || false;
                cb = callback;
            }
            this.makeRequest({
                data: {
                    limit: limit,
                    shift: shift
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
                lastRowIdSeen: opts.startAt
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
                size = opts.size || 'medium';
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
         * @param {function(Error} callback Called when command has been sent.
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
