import Redis from 'ioredis';

export const REDIS_URL = '127.0.0.1:6379';
const REDIS_PASSWORD = undefined;

export const REDIS_OPTIONS: Redis.RedisOptions = {
  password: REDIS_PASSWORD,
  ...(REDIS_URL.startsWith('rediss://') ? { tls: {} } : null),
  retryStrategy: times => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
};

export const client = new Redis(REDIS_URL, REDIS_OPTIONS);

client.on('ready', (_event: any) => {
  console.info({}, 'RedisDB is connected');
});

client.on('error', (err: any) => {
  console.warn({ err }, 'Redis connection error');
});

client.on('reconnecting', (err: any) => {
  console.warn({ err }, 'Redis attempting to reconnect');
});

export const flushDB = () => client.flushdb();

export const redisCommands = {
  get: client.get.bind(client),
  set: client.set.bind(client),
  setex: client.setex.bind(client),
  sadd: client.sadd.bind(client),
  srem: client.srem.bind(client),
  smembers: client.smembers.bind(client),
  hset: client.hset.bind(client),
  hgetall: client.hgetall.bind(client),
  hget: client.hget.bind(client),
  sismember: client.sismember.bind(client),
  expire: client.expire.bind(client),
  exists: async function (...keys: Redis.KeyType[]) {
    return (await client.exists(...keys)) === 1;
  }.bind(client),
  del: client.del.bind(client),
  rpush: client.rpush.bind(client),
  incr: client.incr.bind(client),
  zscore: client.zscore.bind(client),
  zadd: client.zadd.bind(client),
  keys: client.keys.bind(client),
  flushdb: client.flushdb.bind(client),
};
