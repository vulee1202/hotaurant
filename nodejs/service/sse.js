class SSE {
    #clients = [];
    #config; // Store config

    constructor(config) {
        // Accept config in constructor
        this.#config = config; // Assign config to class property
    }

    handle = (req, res) => {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        this.#clients.push(res);

        req.on("close", () => {
            this.#clients = this.#clients.filter((client) => client !== res);
        });
    };

    sendUpdate = (data) => {
        const title = this.#config.IS_PRODUCTION
            ? `PRODUCTION ${this.#config.TITLE_RECIPE}`
            : `STAGING ${this.#config.TITLE_RECIPE}`;
        const updatedData = { ...data, title: title };
        this.#clients.forEach((client) => client.write(`data: ${JSON.stringify(updatedData)}\n\n`));
    };
}

export default (config) => new SSE(config); // Pass config when creating instance
