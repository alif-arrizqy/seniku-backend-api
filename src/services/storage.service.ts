import minioClient from '../config/minio';
import env from '../config/env';
import logger from '../utils/logger';
import { Readable } from 'stream';

export class StorageService {
  private async ensureBucket(bucketName: string): Promise<void> {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      logger.info({ bucket: bucketName }, 'Bucket created');
    }
  }

  async uploadFile(
    bucket: string,
    objectName: string,
    file: Buffer | Readable,
    contentType: string,
    size?: number
  ): Promise<string> {
    try {
      await this.ensureBucket(bucket);

      if (Buffer.isBuffer(file)) {
        await minioClient.putObject(bucket, objectName, file, size || file.length, {
          'Content-Type': contentType,
        });
      } else {
        await minioClient.putObject(bucket, objectName, file, size, {
          'Content-Type': contentType,
        });
      }

      const url = `${env.MINIO_PUBLIC_URL}/${bucket}/${objectName}`;
      logger.info({ bucket, objectName, url }, 'File uploaded successfully');
      return url;
    } catch (error) {
      logger.error({ error, bucket, objectName }, 'Failed to upload file');
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await minioClient.removeObject(bucket, objectName);
      logger.info({ bucket, objectName }, 'File deleted successfully');
    } catch (error) {
      logger.error({ error, bucket, objectName }, 'Failed to delete file');
      throw new Error('Failed to delete file');
    }
  }

  async getFileUrl(bucket: string, objectName: string): Promise<string> {
    return `${env.MINIO_PUBLIC_URL}/${bucket}/${objectName}`;
  }

  async getPresignedUrl(bucket: string, objectName: string, expiry = 3600): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(bucket, objectName, expiry);
      return url;
    } catch (error) {
      logger.error({ error, bucket, objectName }, 'Failed to generate presigned URL');
      throw new Error('Failed to generate presigned URL');
    }
  }

  async fileExists(bucket: string, objectName: string): Promise<boolean> {
    try {
      await minioClient.statObject(bucket, objectName);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new StorageService();

