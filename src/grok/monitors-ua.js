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
            // default poll interval is to start at 3s, then double until 5m is
            // reached
            DEFAULT_POLL_INTERVAL = [3000, 3000000],
            // default increment function doubles increment
            DEFAULT_POLL_INCREMENT = function(i) { return i * 2; },
            ROW_ID = 'ROWID',
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

        function extractLastRowId(output) {
            return output.data[output.data.length - 1][output.names.indexOf(ROW_ID)];
        }

        function Monitor(poller, opts) {
            opts = opts || {};
            this._poller = poller;
            if (typeof opts.interval === 'undefined') {
                this._interval = DEFAULT_POLL_INTERVAL;
            } else if (typeof opts.interval === 'number') {
                // if interval is a number, assume it is the min value, and make the
                // max value 1000x that number of ms
                this._interval = [opts.interval, (opts.interval * 1000)];
            } else {
                this._interval = opts.interval;
            }
            this._increment = opts.increment || DEFAULT_POLL_INCREMENT;
            this._currentInterval = this._interval[0];
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
            this._startTime = new Date().getTime();
            this._print('Monitor starting');
            this._pollAt(this._currentInterval);
            return this;
        };

        Monitor.prototype._pollAt = function(interval) {
            var me = this,
                activePoll = false;

            // clear out existing poll interval
            if (this._pollIntervalId) {
                clearInterval(this._pollIntervalId);
            }
            me._print('Polling at ' + interval);
            this._pollIntervalId = setInterval(function() {
                // ignore if there is already a poll request pending
                if (activePoll) {
                    return;
                }
                activePoll = true;
                me._print('Monitor polling...');
                me._poller(function(pollResult, newDataReceived) {
                    me._print('Monitor received poll result: ');
                    me._print(pollResult);
                    me._print(newDataReceived);
                    if (! newDataReceived) {
                        // no new data was received, so increment the polling
                        // interval. This will kill the current interval and
                        // restart it. But we'll only increment the interval if
                        // we are not already at the max interval value
                        if (me._currentInterval !== me._interval[1]) {
                            me._currentInterval = Math.min(
                                me._increment(me._currentInterval),
                                me._interval[1]
                            );
                            me._pollAt(me._currentInterval);
                        }
                    } else {
                        // if our current interval is not the minimum interval,
                        // reset it to the minimum because we're getting data
                        // once again
                        if (me._currentInterval !== me._interval[0]) {
                            me._currentInterval = me._interval[0];
                            me._print('Resetting poll interval to ' + me._currentInterval);
                            me._pollAt(me._currentInterval);
                        }
                    }
                    // could have completed since poller was called
                    if (! me._done) {
                        me._fire('poll', pollResult);
                    }
                    activePoll = false;
                });
            }, interval);
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
            this._getOutputDataOpts = opts.outputDataOptions || {
                limit: 100
            };
            this._model = model;
            this._dataListeners = [];
            this._lastRowIdSeen = opts.lastRowIdSeen || -1;
            this._doneCounter = 0;
            Monitor.call(this, this._outputPoller, opts);
        }

        PredictionMonitor.prototype = GROK.util.heir(Monitor.prototype);
        PredictionMonitor.prototype.constructor = Monitor;

        PredictionMonitor.prototype._outputPoller = function(cb) {
            var me = this;
            this._print('polling for new model output...');
            this._model.getOutputData(me._getOutputDataOpts, function(err, output) {
                var newDataExists = false,
                    unprocessedData,
                    // grabbing this value here, because it gets set in
                    // _processOutputData below, and I need to use it before it changes.
                    lastRowIdSeen = me._lastRowIdSeen;
                if (err) {
                    return me._fire('error', err);
                }
                // replace the data part of the output with what we think is
                // non-overlapping data, but first save a reference to the
                // unprocessed data (sans header, but with dangling prediction)
                unprocessedData = output.data.slice(1, output.data.length);
                output.data = me._processOutputData(output.data, output.meta);
                if (output.data.length &&
                        lastRowIdSeen !== extractLastRowId(output)) {
                    newDataExists = true;
                }
                // for the onData listeners
                me._data(output, unprocessedData);
                // for the onPoll listeners
                cb(output, newDataExists);

            });
        };

        PredictionMonitor.prototype.onData = function(fn) {
            this._dataListeners.push(fn);
        };

        PredictionMonitor.prototype._data = function(chunk, unProcessedChunk) {
            this._dataListeners.forEach(function(listener) {
                listener(chunk, unProcessedChunk);
            });
        };

        PredictionMonitor.prototype._processOutputData = function(data, meta) {
            var me = this,
                startAt,
                result,
                // data minus headers, but with dangling prediction
                dataOnly = data.slice(1, data.length),
                firstOutputRowId,
                lastOutputRowId;
            if (dataOnly.length === 0 || dataOnly[0].length === 0) {
                // return [] for empty output data
                return [];
            }
            firstOutputRowId = dataOnly[0][0];
            // second to last, actually, because the very last row has no ROWID, 
            // and it only contains the last prediction value for this set
            lastOutputRowId = dataOnly[dataOnly.length - 2][0];
            if (this._lastRowIdSeen === -1) {
                result = dataOnly;
            } else {
                if (firstOutputRowId < this._lastRowIdSeen) {
                    // overlap
                    startAt = findIndex(dataOnly, function(row) {
                        return row[0] === me._lastRowIdSeen + 1;
                    });
                    if (! startAt) {
                        // When there is no startAt, that means the data entirely
                        // overlaps our current data and there is nothing new to
                        // display.
                        result = [];
                    } else {
                        result = dataOnly.slice(startAt);
                    }
                } else if (firstOutputRowId + 1 === this._lastRowIdSeen) {
                    // perfect
                    result = dataOnly;
                } else {
                    // gap
                    me._fire('error', new Error('There was a data gap while retrieving predictions from the API.'));
                    result = dataOnly;
                }
            }

            if (this._lastRowIdSeen === lastOutputRowId) {
                if (meta.modelStatus !== 'swarming' && this._doneCounter > this._repeatTimes) {
                    // do not stop monitoring until model is done swarming
                    this.stop();
                } else {
                    this._doneCounter++;
                }
            }

            this._lastRowIdSeen = lastOutputRowId;
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
