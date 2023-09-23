# npl-protocol-handler

A general-purpose event handler for Evernode HotPocket NPL events with support for arbitrary application-specific protocols.

**`npl-protocol-handler`** is available for installation on [npm](https://www.npmjs.com/package/npl-protocol-handler):

```
npm install npl-protocol-handler
```

# How to use it

1. Import the module:

    ```javascript
    const nplProtocolHandler = require("npl-protocol-handler");
    ```

2. Create and use a compatible application-specific protocol:<br>(see also: "Protocol requirements")

    ```javascript
    const myProtocol = require("my-awesome-protocol");
    ```

3. await **`nplProtocolHandler(...)`** from within your HotPocket smart contract:

    ```javascript
    const myContract = async (ctx) => {
        if (!ctx.readonly) {
            const handler = nplProtocolHandler(
                ctx,
                myProtocol,
                true, // allow autoExit aka premature handler termination
                true, // how to invoke protocol functions (true = await)
                null // custom handler timeout. defaults to roundtime / 2
            );

            ctx.unl.send(myProtocol.buildSomeProtocolMessage());

            const reason = await handler;

            console.log(`npl-protocol-handler exited due to: ${reason}.`);
        }
    };

    const hpc = new HotPocket.Contract();
    hpc.init(myContract);
    ```

    Under normal conditions awaiting **`nplProtocolHandler(...)`** will yield one of these results:

    1. "`timeout`"<br>(This is not a bad thing by default. It just signals that the internal timeout control of **`nplProtocolHandler(...)`** caused termination.)

    2. "`autoExit`"<br>(i.e. the protocol decided to prematurely resolve **`nplProtocolHandler(...)`**. A protocol can make use of this feature to save on HotPocket smart contract roundtime.)

    Internally **`nplProtocolHandler(...)`** at launch performs basic protocol checks. If these are not met then it will throw an `Error`.

# About protocols

## Requirements

**`npl-protocol-handler`** is able to use application-specific protocols. A protocol has just 2 hard requirements to be compatible with **`npl-protocol-handler`**:

1. Must provide an async function for message processing:

    ```javascript
    process: async function (node, msg) {...}
    ```

2. Must provide an async function for signaling premature handler termination (if applicable):

    ```javascript
    isFinished: async function () {...}
    ```

    It can also be used to prematurely exit the handler with a command that originated from the outside: the application could send some agreed-upon message into the NPL which would cause the protocol to signal instant termination of the handler. This would save valuable roundtime and could provide useful for high-performance NPL communication scenarios.

## Nice to know

-   A protocol can be designed to `emit()` asynchronous events which can be captured and processed while **`npl-protocol-handler`** is still active.
-   A protocol can also use some sort of message recorder to collect all received NPL messages. These could e.g. be evaluated after **`npl-protocol-handler`** has already reolved.
-   Both of the aforementioned concepts are shown with the demo contract and protocol in the `example1` directory.
-   `example2` directory contains another example that showcases some other things one can do with protocols: Json message format and optional message compression.

# Prerequisites

Your system must be generally prepared for HotPocket smart contract development.

# Give it a try

A basic smart contract and demo protocol implementation can be found inside of subdirecory `example`. To use it locally follow these steps:

-   `npm link`
-   `cd example1` || `cd example2`
-   `npm link npl-protocol-handler`
-   `npm run test1` || `npm run test2`
