'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type CropArea = { x: number; y: number; width: number; height: number };

async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, size, size, 0, 0, size, size);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.92));
}

interface Props {
  profile: Profile;
  userId: string;
  onClose: () => void;
  onSave: (updated: Partial<Profile>) => void;
}

export default function EditProfileModal({ profile, userId, onClose, onSave }: Props) {
  const [name, setName] = useState(profile.name || '');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [saving, setSaving] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      let avatar_url = profile.avatar_url;

      if (imageSrc && croppedAreaPixels) {
        const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const path = `${userId}.jpg`;
        await supabase.storage.from('avatars').remove([path]);
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' });
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatar_url = `${data.publicUrl}?t=${Date.now()}`;
      }

      await supabase.from('profiles').update({ name: name.trim(), avatar_url }).eq('id', userId);
      onSave({ name: name.trim(), avatar_url });
      onClose();
    } catch (err) {
      console.error('save profile error:', err);
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="composer-tag">[ EDITAR PERFIL ]</span>
          <button className="icon-btn" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          {imageSrc ? (
            <>
              <div style={{ position: 'relative', width: '100%', height: 260, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <input
                type="range" min={1} max={3} step={0.01}
                value={zoom} onChange={e => setZoom(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </>
          ) : (
            profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: 88, height: 88, borderRadius: '50%', border: '2px solid var(--border-lite)' }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700, color: '#1a0f08' }}>
                {initials}
              </div>
            )
          )}

          <label className="btn-ghost" style={{ cursor: 'pointer' }}>
            <Camera size={12} /> {imageSrc ? 'trocar foto' : 'alterar foto'}
            <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--ink-dim)', display: 'block', marginBottom: 6 }}>nome</label>
          <input
            className="comment-input"
            style={{ width: '100%', fontSize: 13 }}
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="edit-actions">
          <button className="btn-ghost" onClick={onClose}><X size={12} /> cancelar</button>
          <button className="publish-btn small" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'salvando…' : 'salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
