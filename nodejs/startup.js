import { createRequire } from "module";
import express from "express";
import cors from "cors";

import config from "./utils/config.js";
import createValidator from "./utils/validator.js";
import createFormatter from "./utils/formatter.js";
import createConverter from "./utils/converter.js";
import createFileManager from "./utils/fileManager.js";

import createLogger from "./service/log/index.js";
import createQueuer from "./service/queue/index.js";
import createCacher from "./service/cache/index.js";
import createSSE from "./service/sse.js";

const require = createRequire(import.meta.url);

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
    const app = express();
    app.use(cors());

    const container = new DependencyContainer();

    const formatter = createFormatter(config);
    const logger = createLogger(config);
    const converter = createConverter(logger);
    const validator = createValidator(logger);

    const sse = createSSE(config);
    const fileManager = createFileManager(config, logger);
    const queuer = createQueuer(config, logger);
    const cacher = createCacher(config, logger);

    container.register("express", app);

    container.register("config", config);
    container.register("validator", validator);
    container.register("formatter", formatter);
    container.register("fileManager", fileManager);

    container.register("sse", sse);
    container.register("logger", logger);
    container.register("queuer", queuer);
    container.register("cacher", cacher);

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

    const logger = container.get("logger");
    logger.info("Dependencies initialized successfully");
} catch (error) {
    throw error;
}

export default container;
