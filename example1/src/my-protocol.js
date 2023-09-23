/**
 * This is just a small protocol for demonstration purposes.
 *
 * npl-protocol-handler is able to use application-specific
 * protocols.
 *
 * A protocol has just 2 hard requirements to be compatible
 * with npl-protocol-handler:
 *
 * 1) must provide an async function for message processing:
 *      process: async function (node, msg) {...}
 *
 * 2) must provide an async function to be ablte to signal
 *    premature handler termination (if applicable):
 *      isFinished: async function () {...}
 */

const EventEmitter = require("events");

const myProtocol = (() => {
    return {
        ctx: null,
        store: null,
        emitter: null,

        init: function (ctx) {
            this.ctx = ctx;
            this.store = new Array();
            this.emitter = new EventEmitter();
        },

        process: async function (node, msg) {
            if (this.ctx.publicKey !== node.publicKey) {
                const o = { node: node.publicKey, msg: msg.toString() };
                this.store.push(o); // message recording is an optional feature that we decided to implement just for this protocol
                this.emitter.emit("receive", o); // asynchronous event emission is also an optional feature that we decided to implement just for this protocol
            }
        },

        isFinished: async function () {
            return (
                this.store.length >= Object.keys(this.ctx.unl.nodes).length - 1
            );
        },

        // this is an example of an application-specific helper function for message construction
        buildPingMessage: function () {
            return "PING";
        },
    };
})();

module.exports = myProtocol;
