import { promises as fs } from "fs";
import path from "path";

class FileManager {
    #config;
    #logger;

    constructor(config, logger) {
        this.#config = config;
        this.#logger = logger;
    }

    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            this.#logger.info(`Deleted log file: ${filePath}`);
        } catch (error) {
            this.#logger.error(`Error deleting log file ${filePath}:`, error);
        }
    }
}

export default (config, logger) => new FileManager(config, logger);
