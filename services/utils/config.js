import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV ? dotenv.config({ path: `.env.${process.env.NODE_ENV}` }) : dotenv.config();

const booleanVars = [];
const arrayVars = [];
const numericVars = [];
const defaultValues = {
    NODE_EXTRA_CA_CERTS: path.resolve(__dirname, "../certs/ca.crt"),
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

process.env.NODE_EXTRA_CA_CERTS = config.NODE_EXTRA_CA_CERTS;

export default config;
