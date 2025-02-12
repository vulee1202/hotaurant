import { createRequire } from "module";
const require = createRequire(import.meta.url);

import fs from "node:fs/promises";
import path from "node:path";

class Logger {
    #logFilePath;
    #config;
    #infoLogFilePath;
    #warnLogFilePath;
    #errorLogFilePath;
    #debugLogFilePath;

    constructor(
        config,
        logFilePath = "app.log",
        infoLogFilePath = "./logs/tx/info.log",
        warnLogFilePath = "./logs/tx/warn.log",
        errorLogFilePath = "./logs/tx/error.log",
        debugLogFilePath = "./logs/tx/debug.log"
    ) {
        this.#config = config;
        this.#logFilePath = path.resolve(logFilePath);
        this.#infoLogFilePath = path.resolve(infoLogFilePath);
        this.#warnLogFilePath = path.resolve(warnLogFilePath);
        this.#errorLogFilePath = path.resolve(errorLogFilePath);
        this.#debugLogFilePath = path.resolve(debugLogFilePath);
    }

    info = (message) => this.#log(message, "INFO");

    warn = (message) => this.#log(message, "WARN");

    debug = (message) => this.#log(message, "DEBUG");

    error = (message, error = null) => this.#log(message, "ERROR", error);

    getLogFilePaths = () => {
        return [
            this.#logFilePath,
            this.#infoLogFilePath,
            this.#warnLogFilePath,
            this.#errorLogFilePath,
            this.#debugLogFilePath,
        ];
    };

    #log = async (message, level = "ERROR", error = null) => {
        const timestamp = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        let logEntry = `[${
            this.#config.IS_PRODUCTION ? "PRODUCTION" : "STAGING"
        }] [${timestamp}] [${level}] ${message}\n`;

        // Ensure log files exist
        const ensureLogFileExists = async (filePath) => {
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, ""); // Create the file if it doesn't exist
            }
        };

        await Promise.all([
            ensureLogFileExists(this.#infoLogFilePath),
            ensureLogFileExists(this.#warnLogFilePath),
            ensureLogFileExists(this.#errorLogFilePath),
            ensureLogFileExists(this.#debugLogFilePath),
        ]);

        const errorLog = async () => {
            if (error) {
                logEntry += `Stack Trace: ${error.stack}\n`;
                await this.debug(`Error occurred: ${message}`);
            }
            console.error(message, error);
            await fs.appendFile(this.#errorLogFilePath, logEntry);
        };

        const infoLog = async () => {
            console.log(message);
            await fs.appendFile(this.#infoLogFilePath, logEntry);
        };

        const warnLog = async () => {
            console.warn(message);
            await fs.appendFile(this.#warnLogFilePath, logEntry);
        };

        const debugLog = async () => {
            console.debug(message);
            await fs.appendFile(this.#debugLogFilePath, logEntry);
        };

        const levelMethods = {
            ERROR: errorLog,
            WARN: warnLog,
            DEBUG: debugLog,
            INFO: infoLog,
        };

        if (levelMethods[level]) {
            await levelMethods[level]();
        } else {
            message = `Unknown log level: ${level}`;
            await levelMethods[level]();
        }

        try {
            await fs.appendFile(this.#logFilePath, logEntry);
        } catch (err) {
            message = `Error writing to log file (${this.#logFilePath}):`;
            error = err;
            await levelMethods[level]();
        }
    };
}

export default (config) => new Logger(config);
