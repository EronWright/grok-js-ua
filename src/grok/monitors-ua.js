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
            DEFAULT_POLL_INTERVAL = 2000,
            ANY = 'any';

        function findIndex(obj, iterator, context) {
            var result;
            Array.prototype.some.call(obj, function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    result = index;
                    return true;
                }
            });
            return result;
        }

        function Monitor(poller, opts) {
            opts = opts || {};
            this._poller = poller;
            this._interval = opts.interval || DEFAULT_POLL_INTERVAL;
            this._debug = opts.debug;
            this._pollIntervalId = -1;
            this._pollListeners = [];
            this._doneListeners = [];
            this._errorListeners = [];
            this._done = false;
        }

        Monitor.prototype.onPoll = function(fn) {
            this._pollListeners.push(fn);
            return this;
        };

        Monitor.prototype.onDone = function(fn) {
            this._doneListeners.push(fn);
            return this;
        };

        Monitor.prototype.onError = function(fn) {
            this._errorListeners.push(fn);
            return this;
        };

        Monitor.prototype._fire = function(evt, payload) {
            this._print('Monitor calling ' + evt + ' listeners');
            if (evt === 'done') {
                this._done = true;
            }
            this['_' + evt + 'Listeners'].forEach(function(listener) {
                listener(payload);
            });
        };

        Monitor.prototype.start = function() {
            var me = this,
                activePoll = false;
            this._startTime = new Date().getTime();
            this._print('Monitor starting');
            this._pollIntervalId = setInterval(function() {
                // ignore if there is already a poll request pending
                if (activePoll) {
                    return;
                }
                activePoll = true;
                me._print('Monitor polling...');
                me._poller(function(pollResult) {
                    me._print('Monitor received poll result: ');
                    // could have completed since poller was called
                    if (! me._done) {
                        me._fire('poll', pollResult);
                    }
                    activePoll = false;
                });
            }, this._interval);
            return this;
        };

        Monitor.prototype.stop = function() {
            var duration = new Date().getTime() - this._startTime;
            this._print('Monitor stopping');
            clearInterval(this._pollIntervalId);
            this._fire('done', duration);
            return duration;
        };

        Monitor.prototype._print = function(msg) {
            if (this._debug) {
                console.log(msg);
            }
        };

        function SwarmMonitor(swarm, opts) {
            this._swarm = swarm;
            this._lastStatus = undefined;
            this._statusChangeListeners = [];
            Monitor.call(this, this._swarmPoller, opts);
        }

        SwarmMonitor.prototype = GROK.util.heir(Monitor.prototype);
        SwarmMonitor.prototype.constructor = Monitor;

        SwarmMonitor.prototype._swarmPoller = function(cb) {
            var me = this;
            this._print('polling for swarm...');
            this._swarm.getStatus(function(err, swarm) {
                if (err) {
                    return me._fire('error', err);
                }
                var status = swarm.get('status');
                if (me._lastStatus && status !== me._lastStatus) {
                    // for the statusChange listeners
                    me.statusChange(swarm);
                }
                me._lastStatus = status;
                // for the onPoll listeners
                cb(swarm);
            });
        };

        SwarmMonitor.prototype.onStatusChange = function(fn) {
            this._statusChangeListeners.push({trigger: ANY, fn: fn});
        };

        SwarmMonitor.prototype.onStatus = function(status, fn) {
            this._statusChangeListeners.push({trigger: status, fn: fn});
        };

        SwarmMonitor.prototype.statusChange = function(swarm) {
            this._print('SwarmMonitor calling statusChange listeners');
            this._statusChangeListeners.forEach(function(listener) {
                var trigger = listener.trigger,
                    fn = listener.fn;
                if (trigger === ANY || trigger === swarm.get('status')) {
                    fn(swarm);
                }
            });
        };

        function PredictionMonitor(model, opts) {
            opts = opts || {};
            opts.interval = opts.interval || 1000;
            this._limit = opts.limit || 100;
            this._repeatTimes = opts.repeatTimes || 15;
            this._model = model;
            this._dataListeners = [];
            this._lastRowSeen = opts.lastRowIdSeen || -1;
            this._doneCounter = 0;
            Monitor.call(this, this._outputPoller, opts);
        }

        PredictionMonitor.prototype = GROK.util.heir(Monitor.prototype);
        PredictionMonitor.prototype.constructor = Monitor;

        PredictionMonitor.prototype._outputPoller = function(cb) {
            var me = this;
            this._print('polling for new model output...');
            this._model.getOutputData({limit: me._limit}, function(err, output) {
                if (err) {
                    return me._fire('error', err);
                }
                // replace the data part of the output with what we think is
                // non-overlapping data
                output.data = me._processOutputData(output.data);
                // for the onData listeners
                me._data(output);
                // for the onPoll listeners
                cb(output);

            });
        };

        PredictionMonitor.prototype.onData = function(fn) {
            this._dataListeners.push(fn);
        };

        PredictionMonitor.prototype._data = function(chunk) {
            this._dataListeners.forEach(function(listener) {
                listener(chunk);
            });
        };

        PredictionMonitor.prototype._processOutputData = function(output) {
            var me = this,
                startAt,
                result,
                firstOutputRow,
                lastOutputRow;
            if (output.length === 0 || output[0].length === 0) {
                // return [] for empty output data
                return [];
            }
            firstOutputRow = output[0][0];
            lastOutputRow = output[output.length - 1][0];
            if (this._lastRowSeen === -1) {
                result = output;
            } else {
                if (firstOutputRow < this._lastRowSeen) {
                    // overlap
                    startAt = findIndex(output, function(row) {
                        return row[0] === me._lastRowSeen + 1;
                    });
                    if (! startAt) {
                        // When there is no startAt, that means the data entirely
                        // overlaps our current data and there is nothing new to
                        // display.
                        result = [];
                    } else {
                        result = output.slice(startAt);
                    }
                } else if (firstOutputRow + 1 === this._lastRowSeen) {
                    // perfect
                    result = output;
                } else {
                    // gap
                    me._fire('error', new Error('There was a data gap while retrieving predictions from the API.'));
                    result = output;
                }
            }

            if (this._lastRowSeen === lastOutputRow) {
                if (this._doneCounter > this._repeatTimes) {
                    this.stop();
                } else {
                    this._doneCounter++;
                }
            }

            this._lastRowSeen = lastOutputRow;
            return result;
        };

        /**
         * This is a utility class meant to poll the API for swarm results and
         * allow listeners to get updated when the swarm changes states.
         * @type {Function}
         */
        GROK.SwarmMonitor = SwarmMonitor;

        /**
         * This is a utility class meant to poll the API for prediction results
         * and allow listeners to get updated when predictions flow in.
         * @type {Function}
         */
        GROK.PredictionMonitor = PredictionMonitor;


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
