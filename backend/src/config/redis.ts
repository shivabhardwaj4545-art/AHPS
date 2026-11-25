import Redis from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      if (times > 3) {
        // Stop retrying aggressively if Redis is not running locally
        return null;
      }
      return Math.min(times * 100, 2000);
    },
  };

  redisClient = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisOptions)
    : new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        ...redisOptions,
      });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('✅ Redis connected successfully.');
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Suppress unhandled crash in dev mode when Redis isn't started
  });
} catch (e) {
  isRedisAvailable = false;
}

export { redisClient, isRedisAvailable };

