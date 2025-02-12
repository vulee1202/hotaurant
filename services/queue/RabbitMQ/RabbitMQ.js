import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import tls from "tls";

const require = createRequire(import.meta.url);
const amqp = require("amqplib");
const fs = require("fs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RabbitMQ {
    #connection;
    #channel;
    #config;
    #logger;
    #queues;
    #queuName;
    #options;

    constructor(config, logger) {
        const _caCert = path.resolve(__dirname, "./certs/ca.crt");
        const _clientCert = path.resolve(__dirname, "./certs/fullchain.client.crt");
        const _clientKey = path.resolve(__dirname, "./certs/client.key");

        this.#config = config;
        this.#logger = logger;
        this.#connection = null;
        this.#channel = null;
        this.#queues = [];
        this.#queuName = "queuName";
        this.#options = {
            ca: [fs.readFileSync(_caCert)],
            cert: fs.readFileSync(_clientCert),
            key: fs.readFileSync(_clientKey),
            rejectUnauthorized: false,
            checkServerIdentity: tls.checkServerIdentity,
            minVersion: "TLSv1.2",
        };
    }

    connect = async (retries = 5, delay = 2000) => {
        try {
            this.#logger.info("Connecting to RabbitMQ...");
            if (!this.#connection) {
                const { RABBITMQ_HOST, RABBITMQ_DEFAULT_USER, RABBITMQ_DEFAULT_PASS } = this.#config;
                const username = encodeURIComponent(RABBITMQ_DEFAULT_USER);
                const password = encodeURIComponent(RABBITMQ_DEFAULT_PASS);
                const url = `amqps://${username}:${password}@${RABBITMQ_HOST}`;

                this.#connection = await amqp.connect(url, this.#options);
                this.#channel = await this.#connection.createChannel();
                this.#logger.info("Connected to RabbitMQ.");
            }
        } catch (error) {
            this.#logger.debug("RABBITMQ_URL: 127.0.0.1");
            this.#logger.error("Error connecting to RabbitMQ", error);

            if (retries > 0) {
                this.#logger.info(`Retrying connection... (${retries} retries left)`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.connect(retries - 1, delay);
            }
            this.#logger.error("Failed to connect to RabbitMQ after multiple attempts.");
            throw error;
        }
    };

    checkMessages = async (queueName) => {
        try {
            const queue = await this.#channel.checkQueue(queueName);
            if (queue.messageCount > 0) {
                this.#logger.info(`Messages exist in queue ${queueName}: ${queue.messageCount}`);
                throw new Error("Please wait for messages to be done before continuing...");
            } else {
                this.#logger.info(`No messages in queue ${queueName}`);
            }
        } catch (error) {
            this.#logger.error("Error checking messages:", error);
            throw error;
        }
    };

    send = async (queue, message) => {
        this.#channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    };

    receive = async (queue, onMessage) => {
        if (!this.#channel) {
            throw new Error("RabbitMQ channel is not initialized");
        }
        await this.#channel.assertQueue(queue);
        this.#channel.consume(queue, (msg) => {
            if (msg !== null) {
                onMessage(msg.content.toString());
                this.#channel.ack(msg);
            }
        });
        this.#logger.info(`Listening for messages on queue ${queue}`);
    };
}

export default (config, logger) => new RabbitMQ(config, logger);
