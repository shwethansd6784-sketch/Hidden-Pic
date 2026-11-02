import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  HardDrive,
  FolderLock,
  Tag
} from 'lucide-react';
import type { Photo, Album } from '../types';
import { supabase } from '../lib/supabase';

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  albums: Album[];
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete: (photo: Photo) => Promise<void>;
  onMoveAlbum?: (photo: Photo, targetAlbumId: string | null) => Promise<void>;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  albums,
  onClose,
  onNavigate,
  onDelete,
  onMoveAlbum,
}) => {
  const [scale, setScale] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    setScale(1);
    setConfirmDelete(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  if (!isOpen || !currentPhoto) return null;

  const currentAlbum = albums.find((a) => a.id === currentPhoto.album_id);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const { data, error } = await supabase.storage
        .from('photos')
        .createSignedUrl(currentPhoto.storage_path, 60, {
          download: currentPhoto.file_name,
        });

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Failed to generate download URL');
      }

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentPhoto.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      if (currentPhoto.signed_url) {
        window.open(currentPhoto.signed_url, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(currentPhoto);
      setConfirmDelete(false);
      if (photos.length <= 1) {
        onClose();
      } else if (currentIndex >= photos.length - 1) {
        onNavigate(currentIndex - 1);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/95 backdrop-blur-md select-none animate-in fade-in duration-200">
      
      {/* Top Action Bar */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-brand-950/90 to-transparent flex items-center justify-between px-6 z-20 text-cream-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-brand-900/80 border border-brand-800 px-2.5 py-1 rounded text-caramel-300">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-sm font-medium text-cream-200 truncate max-w-[200px] sm:max-w-xs">
            {currentPhoto.file_name}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-brand-900/80 rounded-lg border border-brand-800 p-1">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
              title="Zoom In"
              className="p-1.5 hover:text-caramel-300 rounded transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
              title="Zoom Out"
              className="p-1.5 hover:text-caramel-300 rounded transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale(1)}
              title="Reset Zoom"
              className="p-1.5 hover:text-caramel-300 rounded transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download secure copy"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-900 hover:bg-brand-850 border border-brand-800 text-cream-100 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-caramel-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete Photo"
            className="p-2 bg-brand-900 hover:bg-rose-950/80 hover:text-rose-400 border border-brand-800 rounded-lg text-cream-300 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 bg-brand-900 hover:bg-brand-850 border border-brand-800 rounded-lg text-cream-200 hover:text-cream-50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-brand-900/70 hover:bg-brand-900 text-cream-200 hover:text-cream-50 transition z-20 border border-brand-800/80 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-brand-900/70 hover:bg-brand-900 text-cream-200 hover:text-cream-50 transition z-20 border border-brand-800/80 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Image Display */}
      <div className="relative w-full h-full flex items-center justify-center p-8 sm:p-16 overflow-hidden">
        <img
          src={currentPhoto.signed_url}
          alt={currentPhoto.caption || currentPhoto.file_name}
          style={{ transform: `scale(${scale})` }}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-150 cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-950 via-brand-950/80 to-transparent py-4 px-6 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-cream-300 text-xs">
          <div>
            {currentPhoto.caption && (
              <p className="text-sm font-medium text-cream-50 mb-1">
                {currentPhoto.caption}
              </p>
            )}
            <div className="flex items-center gap-4 text-cream-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-caramel-400" />
                {new Date(currentPhoto.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-caramel-400" />
                {(currentPhoto.file_size / (1024 * 1024)).toFixed(2)} MB
              </span>
              {currentAlbum && (
                <span className="flex items-center gap-1 text-caramel-300">
                  <FolderLock className="w-3.5 h-3.5" />
                  {currentAlbum.name}
                </span>
              )}
            </div>
          </div>

          {onMoveAlbum && (
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-caramel-400" />
              <select
                value={currentPhoto.album_id || ''}
                onChange={(e) => onMoveAlbum(currentPhoto, e.target.value ? e.target.value : null)}
                className="bg-brand-900 border border-brand-800 text-cream-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-caramel-500 focus:outline-none"
              >
                <option value="">(No Album)</option>
                {albums.map((alb) => (
                  <option key={alb.id} value={alb.id}>
                    {alb.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-cream-50 text-brand-950 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-cream-300">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-base text-brand-950 mb-1">
              Permanently Delete Photo?
            </h4>
            <p className="text-xs text-brand-700 leading-relaxed mb-5">
              This photo will be completely purged from your private storage vault. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-brand-800 hover:bg-cream-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
