import dotenv from "dotenv";
import os from "os";
dotenv.config();

const booleanVars = ["IS_PRODUCTION", "IS_DEVELOPMENT"];

const arrayVars = [];

const numericVars = [];

const defaultValues = {
    OS: os.platform(),
};

const config = new Proxy(process.env, {
    get: (target, prop) => {
        if (prop in defaultValues && !target[prop]) {
            return defaultValues[prop];
        }
        if (booleanVars.includes(prop)) {
            return target[prop] === "TRUE";
        }
        if (arrayVars.includes(prop)) {
            return target[prop] ? target[prop].split(",") : [];
        }
        if (numericVars.includes(prop)) {
            return target[prop] ? parseFloat(target[prop]) : null;
        }
        return target[prop];
    },
    set: (target, prop, value) => {
        if (booleanVars.includes(prop)) {
            target[prop] = value ? "TRUE" : "FALSE";
        } else if (arrayVars.includes(prop)) {
            target[prop] = Array.isArray(value) ? value.join(",") : value;
        } else if (numericVars.includes(prop)) {
            target[prop] = value.toString();
        } else {
            target[prop] = value;
        }
        return true;
    },
});

export default config;
