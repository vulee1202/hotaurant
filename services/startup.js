import { createRequire } from "module";
const require = createRequire(import.meta.url);

import config from "./utils/config.js";
import createConverter from "./utils/converter.js";
import createFileManager from "./utils/fileManager.js";

import createLogger from "./logs/index.js";
import createQueuer from "./queue/index.js";
import createCacher from "./cache/index.js";
import createRabbitMQ from "./queue/RabbitMQ/RabbitMQ.js";
import createRedis from "./cache/Redis/Redis.js";

class DependencyContainer {
    #dependencies = new Map();

    register(name, instance) {
        this.#dependencies.set(name, instance);
    }

    get(name) {
        if (!this.#dependencies.has(name)) {
            throw new Error(`Dependency ${name} not found`);
        }
        return this.#dependencies.get(name);
    }
}

const createDependencies = () => {
    const container = new DependencyContainer();

    const logger = createLogger(config);
    const converter = createConverter(logger);
    const fileManager = createFileManager(config, logger);

    const rabbitMQ = createRabbitMQ(config, logger);
    const redis = createRedis(config, logger, converter);

    const queuer = createQueuer(config, logger, rabbitMQ);
    const cacher = createCacher(config, logger, redis);

    container.register("config", config);
    container.register("converter", converter);
    container.register("fileManager", fileManager);

    container.register("logger", logger);
    container.register("queuer", queuer);
    container.register("cacher", cacher);

    container.register("rabbitMQ", rabbitMQ);
    container.register("redis", redis);

    return container;
};

const container = createDependencies();

const garbageCollection = async () => {
    const logger = container.get("logger");
    const fileManager = container.get("fileManager");

    // 3 days
    const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000;
    const clearFilesLog = async () => {
        const logFilePaths = logger.getLogFilePaths();

        for (const path of logFilePaths) {
            await fileManager.deleteFile(path);
        }
        logger.info("Garbage collection completed: Deleted log files.");
    };

    await clearFilesLog();

    setInterval(async () => {
        await clearFilesLog();
    }, threeDaysInMilliseconds);
};

try {
    await garbageCollection().catch((error) => {
        const logger = container.get("logger");
        logger.error("Error during initial garbage collection:", error);
    });

    const rabbitMQ = container.get("rabbitMQ");
    await rabbitMQ.connect();

    // const redis = container.get("redis");
    // await redis.connect();

    const logger = container.get("logger");
    logger.info("Dependencies initialized successfully");
} catch (error) {
    throw error;
}

export default container;
