/**
 * This is another protocol for demonstration purposes.
 * - The general message format is Json.
 * - Optional compression support for messages.
 *
 * npl-handler is able to use application-specific protocols.
 *
 * A protocol has just 2 hard requirements to be compatible
 * with npl-handler:
 *
 * 1) must provide an async function for message processing:
 *      process: async function (node, msg) {...}
 *
 * 2) must provide an async function to be ablte to signal
 *    premature handler termination (if applicable):
 *      isFinished: async function () {...}
 */

const zlib = require("zlib");

const tinyJsonProtocol = (() => {
    const receivedMessages = new Object();
    let terminateHandling = false;

    return {
        myOwnPublicKey: null,
        messageTypeField: "messageType",
        compressMessages: false,
        ignoreSelf: true,

        process: async function (node, msg) {
            const message = this.deserializeMessage(msg);
            const messageType = this.getMessageType(message);

            terminateHandling = messageType === "terminate";
            if (node.publicKey !== this.myOwnPublicKey)
                this.recordMessage(messageType, node, message);
        },

        isFinished: async function () {
            return terminateHandling;
        },

        getProtocolName: function () {
            return "TinyJsonProtocol";
        },

        serializeMessage: function (message) {
            return this.compressMessages
                ? zlib.deflateSync(
                      Buffer.from(JSON.stringify(message), "utf-8")
                  )
                : JSON.stringify(message);
        },

        deserializeMessage: function (rawMessage) {
            return this.compressMessages
                ? JSON.parse(zlib.inflateSync(rawMessage).toString("utf-8"))
                : JSON.parse(rawMessage);
        },

        getMessageType: function (message) {
            return message.hasOwnProperty(this.messageTypeField)
                ? message[this.messageTypeField]
                : null;
        },

        isValidMessage: function (message) {
            return this.getMessageType(message) !== null;
        },

        recordMessage: function (messageType, sender, message) {
            if (messageType in receivedMessages === false)
                receivedMessages[messageType] = new Array();
            receivedMessages[messageType].push({
                sender: sender,
                message: message,
            });
        },

        getReceivedMessages: function (messageType) {
            return messageType in receivedMessages
                ? receivedMessages[messageType]
                : null;
        },

        getAllReceivedMessages: function () {
            return receivedMessages;
        },

        buildTerminateMessage: function () {
            const m = {};
            m[this.messageTypeField] = "terminate";
            return m;
        },

        buildPingMessage: function (id) {
            const m = {};
            m[this.messageTypeField] = "ping";
            m["id"] = id; // avoid HotPocket automatic duplicate detection
            return m;
        },
    };
})();

module.exports = tinyJsonProtocol;
