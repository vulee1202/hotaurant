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
        infoLogFilePath = "./logs/info.log",
        warnLogFilePath = "./logs/warn.log",
        errorLogFilePath = "./logs/error.log",
        debugLogFilePath = "./logs/debug.log"
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

    colorLog = (...args) => {
        const coloredArgs = args.map((arg) => arg);
        log(...coloredArgs, "\n");
    };

    getLogFilePaths = () => {
        return [
            this.#logFilePath,
            this.#infoLogFilePath,
            this.#warnLogFilePath,
            this.#errorLogFilePath,
            this.#debugLogFilePath,
        ];
    };

    #log = async (message, level = "INFO", error = null) => {
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

        // Log methods
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

        // Level methods map
        const levelMethods = {
            ERROR: errorLog,
            WARN: warnLog,
            DEBUG: debugLog,
            INFO: infoLog,
        };

        if (levelMethods[level]) {
            await levelMethods[level]();
        } else {
            console.warn(`Unknown log level: ${level}`);
        }

        try {
            await fs.appendFile(this.#logFilePath, logEntry);
        } catch (err) {
            console.error(`Error writing to log file (${this.#logFilePath}):`, err);
        }
    };
}

export default (config) => new Logger(config);
