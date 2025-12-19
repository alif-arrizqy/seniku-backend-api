/**
 * MinIO Setup Script
 * 
 * Script untuk setup buckets dan policies di MinIO
 * 
 * Usage:
 *   npm run setup:minio
 *   atau
 *   tsx scripts/setup-minio.ts
 */

import { Client } from 'minio';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

interface BucketConfig {
  name: string;
  policy: 'public' | 'private';
  description: string;
}

const buckets: BucketConfig[] = [
  {
    name: process.env.MINIO_BUCKET_AVATARS || 'avatars',
    policy: 'public',
    description: 'User avatars - public read access',
  },
  {
    name: process.env.MINIO_BUCKET_SUBMISSIONS || 'submissions',
    policy: 'public',
    description: 'Submission artwork - public read access',
  },
  {
    name: process.env.MINIO_BUCKET_TEMP || 'temp',
    policy: 'private',
    description: 'Temporary uploads - private access',
  },
];

/**
 * Create public read policy JSON
 */
function createPublicReadPolicy(bucketName: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });
}

/**
 * Setup MinIO buckets
 */
async function setupBuckets() {
  console.log('🚀 Setting up MinIO buckets...\n');

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const exists = await minioClient.bucketExists(bucket.name);

      if (!exists) {
        // Create bucket
        await minioClient.makeBucket(bucket.name, 'us-east-1');
        console.log(`✅ Bucket "${bucket.name}" created`);
      } else {
        console.log(`ℹ️  Bucket "${bucket.name}" already exists`);
      }

      // Set bucket policy
      if (bucket.policy === 'public') {
        const policy = createPublicReadPolicy(bucket.name);
        await minioClient.setBucketPolicy(bucket.name, policy);
        console.log(`✅ Bucket "${bucket.name}" policy set to PUBLIC (read-only)`);
      } else {
        // Remove public policy (set to private)
        try {
          await minioClient.setBucketPolicy(bucket.name, '');
          console.log(`✅ Bucket "${bucket.name}" policy set to PRIVATE`);
        } catch (error) {
          // Policy might not exist, that's OK
          console.log(`ℹ️  Bucket "${bucket.name}" policy is PRIVATE`);
        }
      }

      console.log(`   📝 ${bucket.description}\n`);
    } catch (error: any) {
      console.error(`❌ Error setting up bucket "${bucket.name}":`, error.message);
      console.error(`   ${error}\n`);
    }
  }

  console.log('✅ MinIO setup completed!');
  console.log('\n📋 Summary:');
  console.log(`   - Endpoint: ${process.env.MINIO_ENDPOINT || '127.0.0.1'}:${process.env.MINIO_PORT || '9000'}`);
  console.log(`   - Console: http://${process.env.MINIO_ENDPOINT || '127.0.0.1'}:9001`);
  console.log(`   - Public URL: ${process.env.MINIO_PUBLIC_URL || 'http://127.0.0.1:9000'}`);
}

/**
 * Test MinIO connection
 */
async function testConnection() {
  try {
    const buckets = await minioClient.listBuckets();
    console.log('✅ MinIO connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ MinIO connection failed:', error.message);
    console.error('\n💡 Tips:');
    console.error('   1. Make sure MinIO server is running');
    console.error('   2. Check MINIO_ENDPOINT and MINIO_PORT in .env');
    console.error('   3. Verify credentials (MINIO_ACCESS_KEY, MINIO_SECRET_KEY)');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 MinIO Setup Script\n');
  console.log('Configuration:');
  console.log(`   Endpoint: ${process.env.MINIO_ENDPOINT || '127.0.0.1'}:${process.env.MINIO_PORT || '9000'}`);
  console.log(`   Access Key: ${process.env.MINIO_ACCESS_KEY || 'minioadmin'}`);
  console.log(`   Use SSL: ${process.env.MINIO_USE_SSL === 'true'}\n`);

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Setup buckets
  await setupBuckets();
}

// Run script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

