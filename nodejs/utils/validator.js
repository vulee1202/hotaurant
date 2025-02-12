class Validator {
    #logger;
    constructor(logger) {
        this.#logger = logger;
    }

    isJSONObject = (data) =>
        data != null &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        data.constructor === Object &&
        Object.keys(data).length > 0;

    isArray = (data) => Array.isArray(data);

    isValidJSON = (str) => {
        try {
            let json = str;
            if (typeof str === "string") {
                json = JSON.parse(str);
            }
            return this.#areAllObjectsOrAllArray(json);
        } catch (e) {
            this.#logger.error(`Error parsing in isValidJSON`, e);
            return false;
        }
    };

    isToDayUTC = (date) => {
        const today = new Date(Date.UTC(0, 0, 0));
        const dateObj = new Date(date);
        return dateObj.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
    };

    isToDay = (date) => {
        const today = new Date();
        const dateObj = new Date(date);
        return dateObj.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
    };

    isAround10mAgo = (timetemp) => {
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000; // 10 minutes in milliseconds
        return timetemp >= tenMinutesAgo && timetemp <= now;
    };

    #areAllObjectsOrAllArray = (data) =>
        this.isArray(data) ? data.every(this.isArray) || data.every(this.isJSONObject) : this.isJSONObject(data);
}

export default (logger) => new Validator(logger);
