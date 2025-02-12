import { createRequire } from "module";
const require = createRequire(import.meta.url);

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Any } = require("google-protobuf/google/protobuf/any_pb.js");
const packageDefinition = protoLoader.loadSync("service\\cache\\cache.proto", {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const cacheProto = grpc.loadPackageDefinition(packageDefinition).cache;
const anyInstance = new Any();

class Cacher {
    #config;
    #logger;

    constructor(config, logger) {
        this.#config = config;
        this.#logger = logger;
    }

    set = async ({ key, value }) => {
        const { CACHE_DES_PORT } = this.#config;
        const client = new cacheProto.Cacher(CACHE_DES_PORT, grpc.credentials.createInsecure());

        const request = { key, value };

        anyInstance.pack(Buffer.from(JSON.stringify(request)), "example.request");

        try {
            client.set(request, (error, response) => {
                if (error) {
                    this.#logger.error(
                        `Cacher ::: SET ::: Server ==> Service ::: Key ${key}, Value: ${value}, Error:`,
                        error
                    );
                } else {
                    this.#logger.info(
                        `Cacher ::: SET ::: Server ==> Service ::: Key ${key}, Value: ${value}, Response: ${JSON.stringify(
                            response
                        )}`
                    );
                }
            });
        } catch (error) {
            this.#logger.error(
                `Cacher ::: SET ::: Server ==> Service ::: Exception caught ::: Key: ${key}, Error: ${error.message}`,
                {
                    key,
                    error,
                }
            );
            throw new Error(`Failed to fetch the key: ${key}`);
        }
    };

    get = async ({ key }) => {
        const { CACHE_DES_PORT } = this.#config;
        const client = new cacheProto.Cacher(CACHE_DES_PORT, grpc.credentials.createInsecure());
        const request = { key };

        anyInstance.pack(Buffer.from(JSON.stringify(request)), "example.request");

        try {
            const response = await new Promise((resolve, reject) => {
                client.get(request, (error, response) => {
                    if (error) {
                        this.#logger.error(
                            `Cacher ::: GET ::: Server ==> Service ::: Key: ${key}, Error: ${error.message}`,
                            { key, error }
                        );
                        reject(error);
                    } else {
                        this.#logger.info(
                            `Cacher ::: GET ::: Server ==> Service ::: Key: ${key}, Response: ${JSON.stringify(
                                response
                            )}`
                        );
                        resolve(response);
                    }
                });
            });

            return response;
        } catch (error) {
            this.#logger.error(
                `Cacher ::: GET ::: Server ==> Service ::: Exception caught ::: Key: ${key}, Error: ${error.message}`,
                {
                    key,
                    error,
                }
            );
            throw new Error(`Failed to fetch the key: ${key}`);
        }
    };

    run = () => {
        const { CACHE_SRC_PORT } = this.#config;
        const server = new grpc.Server();
        server.addService(cacheProto.Cacher.service, {});
        server.bindAsync(CACHE_SRC_PORT, grpc.ServerCredentials.createInsecure(), () => {
            this.#logger.info(`Cacher running on ${CACHE_SRC_PORT}`);
        });
    };
}

export default (config, logger) => new Cacher(config, logger);
