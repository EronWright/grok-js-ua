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
         * @class A swarm represents a state within the grok engine where a
         * model and its data are being processed to find the best
         * representation for data prediction. Do note create this object
         * manually, use {@link GROK.Model#startSwarm} to create new swarms.
         *
         * @extends GROK.ApiObject
         * @param {Object} attrs Values to create this project with.
         * @param {Object} options Options passed upwards to GROK.ApiObject.
         */
        GROK.Swarm = function(attrs, options) {
            GROK.ApiObject.apply(this, arguments);
            this.constructor = GROK.Swarm;
        };

        GROK.Swarm.prototype = GROK.util.heir(GROK.ApiObject.prototype);
        GROK.Swarm.prototype.constructor = GROK.ApiObject;

        /**
         * @private
         * @static
         */
        GROK.Swarm.NAMESPACE = 'swarms';

        /**
         * Get the status of a swarm.
         * @param {function(Error, GROK.Swarm)} callback Called with a newly
         * populated GROK.Swarm object with current status.
         */
        GROK.Swarm.prototype.getStatus = function(callback) {
            var parent = this.getScalar('_parent');
            parent.getSwarm(this.getId(), callback);
        };


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
