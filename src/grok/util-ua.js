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

        /**********************************************************************
         * Awesome utilities. Every program needs one.
         *********************************************************************/

        global.GROK.util = {
            /**
             * @return {string} Stringified data object.
             * @param {!Object} data Data object to be stringified.
             */
            toUriParams: function(data) {
                var s = '', key;
                for (key in data) {
                    if (data.hasOwnProperty(key)) {
                        s += key + '=' + encodeURIComponent(data[key]) + '&';
                    }
                }
                s = s.substr(0, s.length - 1);
                return s;
            },

            isSet: function(thing) {
                return thing !== undefined && thing !== null;
            },

            shallowObjectClone: function(obj) {
                return JSON.parse(JSON.stringify(obj));
            },

            /**
             * Straight from the Definitive Guide to JavaScript (5th Ed.), by
             * David Flanagan.
             * @param {Object} p Prototype object to create an heir from.
             */
            heir: function(p) {
                function F() {}   // A dummy constructor function
                F.prototype = p;  // Specify the prototype object we want
                return new F();   // Invoke the constructor to create new object
            }
        };

        global.GROK.LOG = {
            ALL: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            NONE: 5
        };

        // Global GROK log level, defaults to ERROR, but easily overrideable by
        // users.
        global.GROK.LOG_LEVEL = global.GROK.LOG.ERROR;

        global.GROK.log = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.ALL) {
                console.log(msg);
            }
        };
        global.GROK.debug = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.DEBUG) {
                if (console.debug) {
                    console.debug(msg);
                } else {
                    console.log(msg);
                }
            }
        };
        global.GROK.info = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.INFO) {
                console.info(msg);
            }
        };
        global.GROK.warn = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.WARN) {
                console.warn(msg);
            }
        };
        global.GROK.error = function(msg) {
            if (this.LOG_LEVEL <= this.LOG.ERROR) {
                console.error(msg);
            }
        };


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
