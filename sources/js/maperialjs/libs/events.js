var _ = require("../../libs/lodash.js");

/*
 * Mixins for an object to let it trigger Events or receive Events.
 * If this object has a parent, the Event bubbles to this parent.
 */
function Events() {

    /* element using this mixin */
    var me = this,

        /* the registered event callbacks */
        listeners = [],

        //-------------------------------------------------------------//
        /*
         * Register a callback for the given event type
         *
         * @param type {string} the event type triggering the callback
         * @param cb {function} the callback used when the event type
         *                      is triggered
         * @param context {any} an optional context used as "this" for
         *                      the triggered callback
         * "this" default to the event emitter if not provided
         */
        on = function (type, cb, context) {
            listeners.push({
                type: type,
                cb: cb,
                context: context || this
            });
        },

        //-------------------------------------------------------------//
        /*
         * Unregister a previously registered callback
         *
         * @param type {string} the type of the event listener to unregister
         * @param cb {function} the callback of the listener to unregister
         */
        off = function (type, cb) {
            listeners = _.filter(listeners, function (listener) {
                return !(listener.type === type && listener.cb === cb);
            })
        },

        //-------------------------------------------------------------//
        /*
         * Trigger an event of the provided type, calling all registered
         * callbacks for this type of event
         *
         * @param type  {string} the type of the listener to trigger
         * @param event {object} the object containg data
         *
         *      event.currentTarget : the element having triggered the
         *      first trigger.
         *
         *      if no currentTarget is set, then the current element is
         *      the first on to call 'trigger'
         *
         *      -> set him as currentTarget
         *
         */
        trigger = function (type, event) {

            event = event || {};
            event.currentTarget = event.currentTarget || me;

            listeners.forEach(function (listener) {
                if (type === listener.type) {
                    listener.cb.call(listener.context, event);
                }

            });

            /* bubbling */
            if (me.parent) {
                me.parent.trigger.call(me.parent, type, event);
            }
        };

    //-------------------------------------------------------------//
    /* public fields */

    this.on = on.bind(this);
    this.off = off.bind(this);
    this.trigger = trigger.bind(this);

    //-------------------------------------------------------------//

    return this;
}

//-------------------------------------------------------------//

module.exports = Events;
