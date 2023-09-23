const nplProtocolHandler = (() => {
    return {
        startProtocolHandler: async function (
            ctx,
            protocol,
            autoExit = true,
            awaitProtocol = true,
            timeoutMs = null
        ) {
            if (ctx.readonly) return;

            // perform basic protocol checks
            if (
                protocol === null ||
                protocol === undefined ||
                typeof protocol !== "object" ||
                typeof protocol.process !== "function" || // hard protocol requirement #1: provide a function to process NPL messages
                typeof protocol.isFinished !== "function" // hard protocol requirement #2: provide a function to signal logical end of message processing
            )
                throw new Error("Invalid protocol.");

            // auto-calc timeoutMs if required
            timeoutMs =
                timeoutMs ??
                Math.ceil((await ctx.getConfig()).consensus.roundtime / 2);
            let timeout = null;
            let doAutoExit = false;

            // catch NPL events and forward to protocol for actual processing
            const p = new Promise((resolve, reject) => {
                ctx.unl.onMessage((node, msg) => {
                    try {
                        // processing may be awaited if desired
                        if (awaitProtocol) {
                            (async () => {
                                await protocol.process(node, msg);
                                doAutoExit =
                                    autoExit && (await protocol.isFinished());
                            })();
                        } else {
                            protocol.process(node, msg);
                            doAutoExit = autoExit && protocol.isFinished();
                        }

                        if (doAutoExit) {
                            // early handler shutdown saves on roundtime (if allowed)
                            if (timeout != null) clearTimeout(timeout);
                            resolve("autoExit");
                        }
                    } catch (error) {
                        console.log(error);
                    }
                });

                // install timeout for handler auto-shutdown
                timeout = setTimeout(() => {
                    resolve("timeout");
                }, timeoutMs);
            });

            return await p;
        },
    };
})();

module.exports = nplProtocolHandler.startProtocolHandler;
