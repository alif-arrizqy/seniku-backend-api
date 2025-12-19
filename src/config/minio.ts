import { Client } from 'minio';
import env from './env';
import logger from '../utils/logger';

const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

// Test connection
const testConnection = async () => {
  try {
    const buckets = await minioClient.listBuckets();
    logger.info({ bucketCount: buckets.length }, 'MinIO connected successfully');
    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MinIO');
    return false;
  }
};

// Initialize connection
testConnection();

export default minioClient;
export { testConnection };

