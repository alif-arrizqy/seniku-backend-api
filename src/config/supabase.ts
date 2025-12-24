import { createClient } from '@supabase/supabase-js';
import env from './env';
import logger from '../utils/logger';

const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test connection
const testConnection = async () => {
  try {
    // Test by listing buckets (this requires storage admin access)
    const { data, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      logger.error({ error }, 'Failed to connect to Supabase Storage');
      return false;
    }
    
    logger.info({ bucketCount: data?.length || 0 }, 'Supabase Storage connected successfully');
    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Supabase Storage');
    return false;
  }
};

// Initialize connection
testConnection();

export default supabaseClient;
export { testConnection };

