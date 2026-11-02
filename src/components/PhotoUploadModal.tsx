import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Album } from '../types';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  albums: Album[];
  selectedAlbumId?: string | null;
  onUploadSuccess: () => void;
}

interface UploadFileItem {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  caption: string;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  albums,
  selectedAlbumId = null,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [targetAlbumId, setTargetAlbumId] = useState<string | null>(selectedAlbumId);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesAdded = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newItems: UploadFileItem[] = [];
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB

    Array.from(selectedFiles).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        alert(`${file.name} exceeds 50MB limit.`);
        return;
      }

      newItems.push({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        caption: '',
      });
    });

    setFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setFiles((prev) => {
      const copy = [...prev];
      copy[index].caption = caption;
      return copy;
    });
  };

  const startUpload = async () => {
    if (!user) {
      alert('You must be signed in to upload photos.');
      return;
    }

    if (!isSupabaseConfigured) {
      alert('Supabase is not configured yet. Please configure your .env file to enable live storage.');
      return;
    }

    setIsUploading(true);

    let allCompleted = true;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === 'success') continue;

      setFiles((prev) => {
        const copy = [...prev];
        copy[i].status = 'uploading';
        copy[i].progress = 30;
        return copy;
      });

      try {
        const fileExt = item.file.name.split('.').pop() || 'jpg';
        const fileUid = window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2);
        const storagePath = `${user.id}/${fileUid}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(storagePath, item.file, {
            contentType: item.file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        setFiles((prev) => {
          const copy = [...prev];
          copy[i].progress = 75;
          return copy;
        });

        const { error: dbError } = await supabase.from('photos').insert({
          user_id: user.id,
          album_id: targetAlbumId || null,
          storage_path: storagePath,
          file_name: item.file.name,
          file_size: item.file.size,
          mime_type: item.file.type,
          caption: item.caption.trim() || null,
        });

        if (dbError) {
          throw new Error(dbError.message);
        }

        setFiles((prev) => {
          const copy = [...prev];
          copy[i].status = 'success';
          copy[i].progress = 100;
          return copy;
        });
      } catch (err: unknown) {
        allCompleted = false;
        const error = err as Error;
        let msg = error.message || 'Upload failed';
        if (msg.includes('Bucket not found') || msg.includes('NoSuchBucket')) {
          msg = "Bucket 'photos' not found in Supabase Storage. Please create a private bucket named 'photos' in your Supabase Storage dashboard.";
        }
        setFiles((prev) => {
          const copy = [...prev];
          copy[i].status = 'error';
          copy[i].error = msg;
          return copy;
        });
      }
    }

    setIsUploading(false);
    onUploadSuccess();

    if (allCompleted) {
      setTimeout(() => {
        onClose();
        setFiles([]);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-cream-50 rounded-2xl shadow-2xl border border-cream-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between bg-cream-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-caramel-100 text-caramel-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-brand-950">Add Photos to Vault</h3>
              <p className="text-xs text-brand-600">Files are encrypted and stored in your private vault.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-brand-500 hover:text-brand-900 hover:bg-cream-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-cream-100 rounded-xl border border-cream-200">
            <label className="text-xs font-semibold text-brand-900">Store in Album:</label>
            <select
              value={targetAlbumId || ''}
              onChange={(e) => setTargetAlbumId(e.target.value ? e.target.value : null)}
              className="bg-cream-50 border border-cream-300 text-brand-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-caramel-500 focus:outline-none w-full sm:w-auto min-w-[200px]"
            >
              <option value="">(No Album - Main Vault)</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-caramel-600 bg-caramel-50/50 scale-[0.99]'
                : 'border-cream-300 hover:border-caramel-500 bg-cream-100/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFilesAdded(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-caramel-100 text-caramel-700 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-brand-950">
              Drag & drop your photos here, or <span className="text-caramel-600 underline">browse files</span>
            </p>
            <p className="text-xs text-brand-500 mt-1">
              Supports JPEG, PNG, WEBP, GIF, HEIC up to 50MB each.
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-800">
                <span>Selected Photos ({files.length})</span>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {files.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                  >
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="w-12 h-12 rounded-lg object-cover border border-cream-300 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-brand-900 truncate max-w-[200px]">
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-brand-500">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="Add a private caption..."
                        value={item.caption}
                        onChange={(e) => updateCaption(idx, e.target.value)}
                        disabled={isUploading || item.status === 'success'}
                        className="w-full mt-1 px-2 py-1 text-[11px] bg-cream-100 border border-cream-200 rounded focus:outline-none focus:border-caramel-500"
                      />

                      {item.status === 'uploading' && (
                        <div className="w-full bg-cream-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="bg-caramel-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'error' && (
                        <p className="text-[10px] text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {item.error}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {item.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : item.status === 'uploading' ? (
                        <Loader2 className="w-5 h-5 text-caramel-600 animate-spin" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          disabled={isUploading}
                          className="p-1 rounded text-brand-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-cream-100 border-t border-cream-200 flex items-center justify-between">
          <span className="text-xs text-brand-600">
            {files.length} {files.length === 1 ? 'file' : 'files'} ready
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-brand-800 hover:bg-cream-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={startUpload}
              disabled={isUploading || files.length === 0}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-caramel-400" />
                  <span>Uploading to Vault...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-caramel-400" />
                  <span>Upload Photos</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
