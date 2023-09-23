const HotPocket = require("hotpocket-nodejs-contract");
const nplProtocolHandler = require("npl-protocol-handler");
const myTinyProtocol = require("npl-protocol-handler/example2/src/tiny-json-protocol");

const myContract = async (ctx) => {
    if (!ctx.readonly) {
        myTinyProtocol.myOwnPublicKey = ctx.publicKey;
        myTinyProtocol.compressMessages = true; // protocol will automatically compress and decompress messages

        // start npl-handler and use dependency injection to hand over this demo protocol
        const handler = nplProtocolHandler(
            ctx,
            myTinyProtocol, // supply your compatible application-specific protocol here
            true, // allow protocol to decide on premature handler termination. this will save on smart contract roundtime.
            true, // await calls from handler into protocol
            null // auto-calc timeout. defaults to roundtime / 2.
        );

        // send some protocol-specific message into NPL
        for (let i = 0; i < 10; i++) {
            ctx.unl.send(
                myTinyProtocol.serializeMessage(
                    myTinyProtocol.buildPingMessage(i)
                )
            );
        }

        // instruct protocol to set termination signal for npl-protocol-handler.
        // with this handler doesn't have to wait until timeout triggers and we
        // save on valuable roundtime!
        ctx.unl.send(
            myTinyProtocol.serializeMessage(
                myTinyProtocol.buildTerminateMessage()
            )
        );

        // wait for end of npl-protocol-handler: either from timeout or due to protocol policy (in this case: "terminate" message)
        const reason = await handler;

        // log overall results: since this specific protocol uses an internal message recorder we can show more than just the handler's termination reason
        console.log(
            `npl-protocol-handler exited due to: ${reason}. It received ${
                myTinyProtocol.getReceivedMessages("ping").length
            } PINGs from other nodes.`
        );
    }
};

const hpc = new HotPocket.Contract();
hpc.init(myContract);
