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
         * @class Stream object, which represents a set of data and its
         * definition for a model to use when making predictions. Do not use
         * this constructor to create a {@link GROK.Stream} object, use other
         * API objects like {@link GROK.Client#createStream} or
         * {@link GROK.Project#createStream}.
         *
         * @extends GROK.ApiObject
         * @param {Object} attrs Values to create this project with.
         * @param {Object} options Options passed upwards to
         * {@link GROK.ApiObject}.
         */
        GROK.Stream = function(attrs, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Stream;
        };

        GROK.Stream.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Stream.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Stream.NAMESPACE = 'streams';

        /**
         * <p>Add new data to a stream, which will be passed to the API. The
         * data should be an array of arrays, which represents rows and
         * fields.</p>
         *
         * <p>The data you add must match the format of the stream specification
         * used to create the stream.</p>
         *
         * @param {Object} rawData Should be an array of data to add to a
         * streams input cache.
         * @param {function(Error)} callback Called when added.
         */
        GROK.Stream.prototype.addData = function(rawData, callback) {
            this.makeRequest({
                method: 'POST',
                url: this.get('dataUrl'),
                data: {
                    input: rawData
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
         * Get the current data within a stream's input cache.
         * @param {function(Error)} callback Called when data is retrieved.
         */
        GROK.Stream.prototype.getInputData = function(callback) {
            this.makeRequest({
                method: 'GET',
                url: this.get('dataUrl'),
                success: function(resp) {
                    if (! resp.input) {
                        callback(new Error('malformed API response! ' +
                            'Expected "input" key.'));
                    } else {
                        callback(null, resp.input);
                    }
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
