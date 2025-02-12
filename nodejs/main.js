import container from "./startup.js";

class App {
    #config;
    #express;
    #sse;
    #logger;
    #cacher;
    #queuer;

    constructor(container) {
        this.#config = container.get("config");
        this.#express = container.get("express");
        this.#sse = container.get("sse");
        this.#logger = container.get("logger");
        this.#cacher = container.get("cacher");
        this.#queuer = container.get("queuer");
        this.#initialize();
    }

    #initialize = () => {
        this.#cacher.run();
        this.#queuer.run();

        this.#initializeExpress();
        this.#testQueuer();
        this.#testCacher();
    };

    #initializeExpress = () => {
        const { SSE_PORT } = this.#config;
        this.#express.listen(SSE_PORT, "0.0.0.0", () => {
            this.#logger.info(`SSE server started on port ${SSE_PORT}`);
        });
        this.#express.get("/sse", (req, res) => this.#sse.handle(req, res));
    };

    #testQueuer = async () => {
        await this.#queuer.send({ queue: "QueueTest", message: { name: "Vu le", age: 20 } });
    };

    #testCacher = async () => {
        await this.#cacher.set({ key: "CacheTest", value: { name: "Vu le", age: 20 } });
        const cached = await this.#cacher.get({ key: "CacheTest" });
    };
}

const createApp = (container) => new App(container);
createApp(container);
