import { createClient } from './supabase';

export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('post-images').upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path);
  return publicUrl;
}
