import { createRequire } from "module";
const require = createRequire(import.meta.url);

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Any } = require("google-protobuf/google/protobuf/any_pb.js");
const packageDefinition = protoLoader.loadSync("cache\\cache.proto", {
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
    #redis;

    constructor(config, logger, redis) {
        this.#config = config;
        this.#logger = logger;
        this.#redis = redis;
    }

    set = async (call, callback) => {
        const { key, value } = call.request;

        this.#logger.info(`Cacher ::: SETTING ::: Service ::: Key ${key}, Value: ${JSON.stringify(value)}`);
        /* Action */
        await this.#redis.set(key, value);
        /* Action */
        this.#logger.info(`Cacher ::: SET ::: Service ::: Key ${key}, Value: ${JSON.stringify(value)}`);

        callback(null, { status_code: 200 });
    };

    get = async (call, callback) => {
        const { key } = call.request;

        this.#logger.info(`Cacher ::: GETTING ::: Service ::: Key ${key}`);
        /* Action */
        const value = await this.#redis.get(key);
        /* Action */
        this.#logger.info(`Cacher ::: GOT ::: Service ::: Key ${key}, Value: ${JSON.stringify(value)}`);

        callback(null, { value, status_code: 200 });
    };

    run = () => {
        const { CACHE_SRC_PORT } = this.#config;
        const server = new grpc.Server();
        server.addService(cacheProto.Cacher.service, { set: this.set.bind(this), get: this.get.bind(this) });
        server.bindAsync(CACHE_SRC_PORT, grpc.ServerCredentials.createInsecure(), () => {
            this.#logger.info(`Cacher running on ${CACHE_SRC_PORT}`);
        });
    };
}

export default (config, logger, redis) => new Cacher(config, logger, redis);
