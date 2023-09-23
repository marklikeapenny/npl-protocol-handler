const HotPocket = require("hotpocket-nodejs-contract");
const nplProtocolHandler = require("npl-protocol-handler");
const myProtocol = require("npl-protocol-handler/example1/src/my-protocol");

const myContract = async (ctx) => {
    if (!ctx.readonly) {
        // setup the supplied demo protocol; you can use your own application specific protocol here.
        myProtocol.init(ctx);

        // this demo protocol has support for asynchronous event notifications
        myProtocol.emitter.on("receive", (args) => {
            console.log(
                `Received message with args: "${JSON.stringify(args)}".`
            );
        });

        // start npl-handler and use dependency injection to hand over this demo protocol
        const handler = nplProtocolHandler(
            ctx,
            myProtocol, // supply your compatible application-specific protocol here
            true, // allow protocol to decide on premature handler termination. this will save on smart contract roundtime.
            true, // await calls from handler into protocol
            null // auto-calc timeout. defaults to roundtime / 2.
        );

        // send some protocol-specific message into NPL
        ctx.unl.send(myProtocol.buildPingMessage());

        // wait for end of npl-protocol-handler: either from timeout or due to protocol policy
        const reason = await handler;

        // log overall results: since this specific protocol uses an internal message recorder we can show more than just the handler's termination reason
        console.log(
            `In total ${myProtocol.store.length} were received. npl-protocol-handler exited due to: ${reason}.`
        );
    }
};

const hpc = new HotPocket.Contract();
hpc.init(myContract);
