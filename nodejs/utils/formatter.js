class Formatter {
    #config;

    constructor(config) {
        this.#config = config;
    }

    toDateString = (date, format = "yyyy-MM-DD HH:mm:ss") => {
        try {
            if (!(date instanceof Date)) {
                date = new Date(date);
            }
            const formatParts = {
                yyyy: date.getFullYear(),
                MM: String(date.getMonth() + 1).padStart(2, "0"),
                DD: String(date.getDate()).padStart(2, "0"),
                HH: String(date.getHours()).padStart(2, "0"),
                mm: String(date.getMinutes()).padStart(2, "0"),
                ss: String(date.getSeconds()).padStart(2, "0"),
            };
            return format.replace(/yyyy|MM|DD|HH|mm|ss/g, (match) => formatParts[match]);
        } catch (error) {
            return date;
        }
    };

    toTimestamp = (date) => {
        try {
            if (!(date instanceof Date)) {
                date = new Date(date);
            }
            return date.getTime();
        } catch (error) {
            return date;
        }
    };

    number = (value, decimals) => Number(value).toFixed(decimals);

    price = (price, decimals = 2) => this.number(price, decimals);

    quantity = (quantity, decimals = 6) => this.number(quantity, decimals);

    OHLCV = ([timestamp, open, high, low, close, volume]) => ({
        timestamp: this.timestamp(timestamp),
        open: this.price(open),
        high: this.price(high),
        low: this.price(low),
        close: this.price(close),
        volume: this.quantity(volume),
    });

    indicator = (indicator, fields) => {
        if (!indicator) return null;
        return Object.fromEntries(fields.map((field) => [field, this.price(indicator[field])]));
    };

    MACD = (macd) => this.indicator(macd, ["dif", "dea", "histogram"]);
    RSI = (rsi) => this.indicator(rsi, ["rsi6", "rsi14", "rsi26"]);
    KDJ = (kdj) => this.indicator(kdj, ["k", "d", "j"]);

    SAR = (sar) => {
        if (!sar) return null;
        return {
            value: this.price(sar.value),
            trend: sar.trend,
        };
    };

    indicators = (indicators) => {
        if (!indicators) return null;
        return {
            macd: this.MACD(indicators.macd),
            rsi: this.RSI(indicators.rsi),
            kdj: this.KDJ(indicators.kdj),
            sar: this.SAR(indicators.sar),
        };
    };

    balance = (balance) =>
        Object.fromEntries(Object.entries(balance).map(([currency, amount]) => [currency, this.quantity(amount)]));

    order = (order) => {
        const { id, symbol, type, side, price, amount, cost, status, timestamp } = order;
        return {
            id,
            symbol: this.symbol(symbol),
            type,
            side,
            price: this.price(price),
            amount: this.quantity(amount),
            cost: this.price(cost),
            status,
            timestamp: this.timestamp(timestamp),
        };
    };

    indicators = (indicators, index) => {
        const { IS_ELIGIBLE_STRATEGY } = this.#config;
        const rsis = indicators.rsi;
        const macds = indicators.macd;
        const kdjs = indicators.kdj;
        const sars = indicators.sar;

        if (IS_ELIGIBLE_STRATEGY && sars.length < 7) return;
        else if (!IS_ELIGIBLE_STRATEGY) if (macds.length < 35 || rsis.length < 35 || kdjs.length < 35) return;

        const indicator = {
            rsi: this.indicator(rsis, index),
            macd: this.indicator(macds, index),
            kdj: this.indicator(kdjs, index),
            sar: this.indicator(sars, index),
        };
        return indicator;
    };

    indicator = (indicators, index) => {
        if (!indicators || !indicators.length) return null;

        return {
            previous2: indicators[index - 2],
            previous: indicators[index - 1],
            current: indicators[index],
        };
    };
}

export default (config) => new Formatter(config);
