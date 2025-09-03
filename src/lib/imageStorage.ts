import { supabase } from "@/integrations/supabase/client";

export class ImageStorage {
  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(file: File, folder: string = 'images'): Promise<string> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) {
        console.warn('Failed to delete image:', error.message);
      }
    } catch (error) {
      console.warn('Image deletion failed:', error);
    }
  }

  /**
   * Fallback: Store small images as base64 in Firestore
   */
  static async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check file size (max 1MB for base64)
      if (file.size > 1024 * 1024) {
        reject(new Error('File too large for base64 storage (max 1MB)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Smart upload: Use Supabase for large files, base64 for small ones
   */
  static async smartUpload(file: File, folder: string = 'images'): Promise<string> {
    try {
      // Try Supabase first for better performance
      return await this.uploadImage(file, folder);
    } catch (supabaseError) {
      console.warn('Supabase upload failed, trying base64:', supabaseError);
      
      // Fallback to base64 for small files
      if (file.size <= 1024 * 1024) { // 1MB
        return await this.convertToBase64(file);
      }
      
      throw new Error('File too large and Supabase unavailable');
    }
  }
}
