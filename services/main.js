import container from "./startup.js";

class Service {
    #queuer;
    #cacher;
    #logger;

    constructor(container) {
        this.#queuer = container.get("queuer");
        this.#cacher = container.get("cacher");
    }

    run = () => {
        this.#queuer.run();
        this.#cacher.run();
    };
}

const createService = () => new Service(container);
const service = createService();
service.run();
