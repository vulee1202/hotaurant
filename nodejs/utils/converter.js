import { createHash } from "crypto";

class Converter {
    #hashAlgorithm;
    #logger;

    constructor(logger) {
        this.#hashAlgorithm = "sha256";
        this.#logger = logger;
    }

    generateHash = (data) => {
        return createHash(this.#hashAlgorithm).update(data).digest("hex");
    };

    parseDateFromString = (dateString) => {
        const [day, month, year] = dateString.slice(0, 10).split("/");
        return new Date(year, month - 1, day).getTime();
    };

    parseStringToDate = (datestr) => {
        if (!datestr) return new Date();

        const [year, month, day] = [datestr.slice(0, 4), datestr.slice(4, 6), datestr.slice(6, 8)];
        return new Date(+year, +month - 1, +day);
    };

    getDateFromString = (dateString) => {
        const formats = [
            { regex: /^\d{4}-\d{2}-\d{2}$/, parser: (s) => new Date(s) },
            { regex: /^\d{2}\/\d{2}\/\d{4}$/, parser: (s) => this.parseDateFromString(s) },
            { regex: /^\d{8}$/, parser: (s) => this.parseStringToDate(s) },
        ];

        for (const { regex, parser } of formats) {
            if (regex.test(dateString)) {
                return parser(dateString);
            }
        }

        throw new Error(`Unsupported date format: ${dateString}`);
    };

    formatDate = (date, format = "yyyy-MM-dd") => {
        try {
            if (!this.isValidDate(date)) {
                date = new Date(date);
            }
        } catch (error) {
            throw new Error(error);
        }
        const formatParts = {
            yyyy: date.getFullYear(),
            MM: String(date.getMonth() + 1).padStart(2, "0"),
            dd: String(date.getDate()).padStart(2, "0"),
        };

        return format.replace(/yyyy|MM|dd/g, (match) => formatParts[match]);
    };

    convertToTimestamp = (date) => {
        return date instanceof Date ? date.getTime() : new Date(date).getTime();
    };

    convertTimestampToDate = (timestamp) => {
        return new Date(timestamp);
    };

    isValidDate = (date) => {
        return date instanceof Date && !Number.isNaN(date.getTime());
    };

    // O: Origins, H: Highs, L: Lows, C: Closes
    toOHLC = (ohlcv) => {
        try {
            return ohlcv
                .map(([timestamp, open, high, low, close, volume]) => ({
                    timestemp: this.formatDate(new Date(timestamp)),
                    miliSeconds: timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume,
                }))
                .reduce(
                    (acc, price) => {
                        acc.origins.push(price);
                        acc.highs.push(price.high);
                        acc.lows.push(price.low);
                        acc.closes.push(price.close);
                        acc.opens.push(price.open);
                        return acc;
                    },
                    { origins: [], highs: [], lows: [], closes: [], opens: [] }
                );
        } catch (error) {
            this.#logger.error("Error in toOHLC:", error);
            throw error;
        }
    };

    calculateSinceDate(startDate, timeframe) {
        const sinceDate = new Date(startDate);
        sinceDate.setSeconds(0);
        sinceDate.setMilliseconds(0);

        const timeframeMap = {
            "1d": () => sinceDate.setDate(sinceDate.getDate() - 50),
            "4h": () => sinceDate.setHours(sinceDate.getHours() - 4 * 50),
            "1h": () => sinceDate.setHours(sinceDate.getHours() - 50),
            "15m": () => sinceDate.setMinutes(sinceDate.getMinutes() - 15 * 50),
        };

        (timeframeMap[timeframe] || (() => {}))();
        return sinceDate.getTime();
    }

    dateDiff(startDate, endDate) {
        try {
            if (!this.isValidDate(startDate)) {
                startDate = new Date(startDate);
            }
            if (!this.isValidDate(endDate)) {
                endDate = new Date(endDate);
            }

            const diffInMs = endDate.getTime() - startDate.getTime();
            return diffInMs / (1000 * 60 * 60 * 24);
        } catch (error) {
            this.#logger.error("Error in dateDiff:", error);
        }
    }
}

export default (logger) => new Converter(logger);
