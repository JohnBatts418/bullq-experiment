"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisCommands = exports.flushDB = exports.client = exports.REDIS_OPTIONS = exports.REDIS_URL = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.REDIS_URL = '127.0.0.1:6379';
const REDIS_PASSWORD = undefined;
exports.REDIS_OPTIONS = Object.assign(Object.assign({ password: REDIS_PASSWORD }, (exports.REDIS_URL.startsWith('rediss://') ? { tls: {} } : null)), { retryStrategy: times => {
        // reconnect after
        return Math.min(times * 50, 2000);
    } });
exports.client = new ioredis_1.default(exports.REDIS_URL, exports.REDIS_OPTIONS);
exports.client.on('ready', (_event) => {
    console.info({}, 'RedisDB is connected');
});
exports.client.on('error', (err) => {
    console.warn({ err }, 'Redis connection error');
});
exports.client.on('reconnecting', (err) => {
    console.warn({ err }, 'Redis attempting to reconnect');
});
const flushDB = () => exports.client.flushdb();
exports.flushDB = flushDB;
exports.redisCommands = {
    get: exports.client.get.bind(exports.client),
    set: exports.client.set.bind(exports.client),
    setex: exports.client.setex.bind(exports.client),
    sadd: exports.client.sadd.bind(exports.client),
    srem: exports.client.srem.bind(exports.client),
    smembers: exports.client.smembers.bind(exports.client),
    hset: exports.client.hset.bind(exports.client),
    hgetall: exports.client.hgetall.bind(exports.client),
    hget: exports.client.hget.bind(exports.client),
    sismember: exports.client.sismember.bind(exports.client),
    expire: exports.client.expire.bind(exports.client),
    exists: function (...keys) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield exports.client.exists(...keys)) === 1;
        });
    }.bind(exports.client),
    del: exports.client.del.bind(exports.client),
    rpush: exports.client.rpush.bind(exports.client),
    incr: exports.client.incr.bind(exports.client),
    zscore: exports.client.zscore.bind(exports.client),
    zadd: exports.client.zadd.bind(exports.client),
    keys: exports.client.keys.bind(exports.client),
    flushdb: exports.client.flushdb.bind(exports.client),
};
