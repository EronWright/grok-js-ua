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
 * @class Grok Action object
 * @extends GROK.ApiObject 
 */
GROK.Action = function(attrs, options) {
    GROK.ApiObject.apply(this, arguments);
    this.constructor = GROK.Action;
};

GROK.Action.prototype = GROK.util.heir(GROK.ApiObject.prototype);
GROK.Action.prototype.constructor = GROK.ApiObject;

GROK.Action.NAMESPACE = 'actions';


/******************************************************************************
 * The postfix below allows this JS source code to be executed within the UA
 * environment.
 *****************************************************************************/

    }
)(window);
