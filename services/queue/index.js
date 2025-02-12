import { createRequire } from "module";
const require = createRequire(import.meta.url);

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Any } = require("google-protobuf/google/protobuf/any_pb.js");
const packageDefinition = protoLoader.loadSync("queue\\queue.proto", {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const queueProto = grpc.loadPackageDefinition(packageDefinition).queue;
const anyInstance = new Any();

class Queuer {
    #config;
    #logger;
    #rabbtitMQ;

    constructor(config, logger, rabbitMQ) {
        this.#config = config;
        this.#logger = logger;
        this.#rabbtitMQ = rabbitMQ;
    }

    send = async (call, callback) => {
        const { queue, message } = call.request;

        this.#logger.info(`Queuer ::: SENDING ::: Service ::: Queue ${queue}, Message: ${JSON.stringify(message)}`);
        /* Action */
        await this.#rabbtitMQ.send(queue, message);

        this.#rabbtitMQ.receive(queue, (message) => this.receive({ queue, message }));
        /* Action */
        this.#logger.info(`Queuer ::: SEND ::: Service ::: Queue ${queue}, Message: ${JSON.stringify(message)}`);

        callback(null, { status_code: 200 });
    };

    receive = async ({ queue, message }) => {
        const { QUEUE_DES_PORT } = this.#config;
        const client = new queueProto.Queuer(QUEUE_DES_PORT, grpc.credentials.createInsecure());

        const request = { queue, message };

        anyInstance.pack(Buffer.from(JSON.stringify(request)), "example.request");

        try {
            client.receive(request, (error, response) => {
                if (error) {
                    this.#logger.error(
                        `Queuer ::: RECEIVE ::: Service ==> Server ::: Queue ${queue}, Message: ${JSON.stringify(
                            message
                        )}, Error:`,
                        error
                    );
                } else {
                    this.#logger.info(
                        `Queuer ::: RECEIVE ::: Service ==> Server ::: Queue ${queue}, Message: ${JSON.stringify(
                            message
                        )}, Response: ${JSON.stringify(response)}`
                    );
                }
            });
        } catch (error) {
            this.#logger.error(
                `Queuer ::: RECEIVE ::: Service ==> Server ::: Exception caught ::: Queue: ${queue}, Error: ${error.message}`,
                {
                    key,
                    error,
                }
            );
            throw new Error(`Failed to fetch the key: ${key}`);
        }
    };

    run = () => {
        const { QUEUE_SRC_PORT } = this.#config;
        const server = new grpc.Server();
        server.addService(queueProto.Queuer.service, { send: this.send.bind(this) });
        server.bindAsync(QUEUE_SRC_PORT, grpc.ServerCredentials.createInsecure(), () => {
            this.#logger.info(`Queuer running on ${QUEUE_SRC_PORT}`);
        });
    };
}

export default (config, logger, rabbitMQ) => new Queuer(config, logger, rabbitMQ);
