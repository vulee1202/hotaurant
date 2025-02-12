import redis from "redis";

class Redis {
    #config;
    #logger;
    #converter;
    #client;
    #redis;

    constructor(config, logger, converter, redis) {
        this.#config = config;
        this.#logger = logger;
        this.#converter = converter;
        this.#redis = redis;
    }

    connect = async (retries = 5, delay = 1000) => {
        if (!this.#client) {
            this.#createClient();
        }

        if (!this.#client.isOpen) {
            this.#logger.info("Connecting to Redis...");
            try {
                await this.#client.connect();
            } catch (err) {
                this.#logger.debug("REDIS_URL: " + this.#config.REDIS_URL);
                this.#logger.error("Error connecting to Redis", error);

                if (retries > 0) {
                    this.#logger.info(`Retrying connection... (${retries} retries left)`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    return this.connect(retries - 1, delay);
                }
                this.#logger.error("Failed to connect to Redis after multiple attempts.");
                throw error;
            }
        }
    };

    memoize = (fn) => {
        return async (...args) => {
            try {
                await this.connect();

                const hash = this.#converter.generateHash(JSON.stringify(args));

                return new Promise((resolve, reject) => {
                    this.#client.get(hash, async (err, result) => {
                        if (err) return reject(err);
                        if (result) return resolve(JSON.parse(result));

                        const computedResult = await fn(...args);
                        this.#client.set(hash, JSON.stringify(computedResult));
                        resolve(computedResult);
                    });
                });
            } catch (error) {
                this.#logger.error(error);
            }
        };
    };

    set = async (key, value) => {
        try {
            const stringValue = JSON.stringify(value);
            await this.#client.set(key, stringValue);
        } catch (err) {
            this.#logger.error("Error setting value in Redis:", err);
        }
    };

    get = async (key) => {
        try {
            const value = await this.#client.get(key);
            if (value !== null) {
                return JSON.parse(value);
            }
            return value;
        } catch (err) {
            this.#logger.error("Error getting value from Redis:", err);
        }
    };

    #createClient = () => {
        this.#client = this.#redis.createClient({
            url: this.#config.REDIS_URL,
        });

        this.#client.on("connecting", () => {
            this.#logger.info("Connecting to Redis...");
        });

        this.#client.on("connect", () => {
            this.#logger.info("Connected to Redis");
        });

        this.#client.on("error", (err) => {
            this.#logger.error("Redis error to connect to URL: " + this.#config.REDIS_URL, err);
        });

        this.#client.on("end", () => {
            this.#logger.warn("Redis connection closed");
        });

        this.#client.on("reconnecting", () => {
            this.#logger.info("Reconnecting to Redis");
        });

        this.#client.on("close", () => {
            this.#logger.info("Closed connection to Redis");
        });

        this.#client.on("ready", () => {
            this.#logger.info("Redis is ready");
        });
    };
}

export default (config, logger, converter) => new Redis(config, logger, converter, redis);
