import { supabase } from '../lib/supabase';

/**
 * Storage service for handling file uploads to Supabase Storage
 */
class StorageService {
  constructor() {
    this.bucketName = 'deliverable-files';
  }

  /**
   * Check if storage bucket exists
   */
  async initializeBucket() {
    if (!supabase) {
      console.warn('Supabase not configured, using local storage');
      return false;
    }

    try {
      // Try to list files from the bucket as a way to check if it exists
      // This works even when listBuckets() fails due to permissions
      const { error: testError } = await supabase
        .storage
        .from(this.bucketName)
        .list('test', { limit: 1 });

      if (testError) {
        // Check if it's a "bucket not found" error
        if (testError.message?.includes('not found') || testError.statusCode === 404) {
          console.error(`Storage bucket '${this.bucketName}' not found. Please create it in Supabase Dashboard.`);
          console.error('Go to: Storage > New Bucket > Name: deliverable-files > Public: Yes');
          return false;
        }
        // Other errors (like empty bucket) are fine
      }

      console.log(`Storage bucket '${this.bucketName}' is available`);
      return true;
    } catch (error) {
      console.error('Error checking storage bucket:', error);
      // Assume bucket exists if we can't check
      console.warn('Could not verify bucket, proceeding with upload attempt');
      return true;
    }
  }

  /**
   * Upload a file to Supabase Storage
   * @param {File} file - The file to upload
   * @param {string} deliverableId - The deliverable ID
   * @param {string} versionNumber - The version number
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadFile(file, deliverableId, versionNumber) {
    if (!supabase) {
      // Fallback to blob URL for local development
      const url = URL.createObjectURL(file);
      return { url, path: null };
    }

    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        console.error('Authentication required for file upload');
        throw new Error('You must be logged in to upload files');
      }

      // Try to verify bucket exists (non-blocking)
      await this.initializeBucket();

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${deliverableId}/${versionNumber}_${timestamp}_${sanitizedFileName}`;

      console.log('Uploading file to Supabase Storage:', {
        path: filePath,
        size: file.size,
        type: file.type,
        bucket: this.bucketName
      });

      // Upload file to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        console.error('Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error
        });
        
        // Provide helpful error message
        if (error.message?.includes('not found') || error.statusCode === 404) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log('File uploaded successfully:', {
        path: data.path,
        url: publicUrl
      });

      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      console.error('Full error:', error);
      
      // For now, don't fallback to base64 - let the error bubble up
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} filePath - The file path in storage
   */
  async deleteFile(filePath) {
    if (!supabase || !filePath) return;

    try {
      const { error } = await supabase
        .storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  /**
   * Get a signed URL for private file access
   * @param {string} filePath - The file path in storage
   * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    if (!supabase || !filePath) return null;

    try {
      const { data, error } = await supabase
        .storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
  }

  /**
   * Download a file from storage
   * @param {string} filePath - The file path in storage
   */
  async downloadFile(filePath) {
    if (!supabase || !filePath) return null;

    try {
      const { data, error } = await supabase
        .storage
        .from(this.bucketName)
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to download file:', error);
      return null;
    }
  }
}

// Create singleton instance
const storageService = new StorageService();

// Initialize bucket on module load
if (supabase) {
  storageService.initializeBucket().catch(console.error);
}

export default storageService;