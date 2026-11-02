import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Search,
  Filter,
  Images,
  RefreshCw,
  FolderPlus,
  ArrowUpDown,
  AlertTriangle,
  Lock,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Photo, Album } from '../types';
import { PhotoUploadModal } from '../components/PhotoUploadModal';
import { PhotoLightbox } from '../components/PhotoLightbox';
import { AlbumModal } from '../components/AlbumModal';

export const VaultPage: React.FC = () => {
  const { user, revocationMessage, clearRevocationMessage } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch albums
  const fetchAlbums = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setAlbums(data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
    }
  }, [user]);

  // Fetch photos with short-lived signed URLs
  const fetchPhotos = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let query = supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id);

      if (selectedAlbumId) {
        query = query.eq('album_id', selectedAlbumId);
      }

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
      else if (sortBy === 'name') query = query.order('file_name', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const photosWithUrls: Photo[] = await Promise.all(
        (data || []).map(async (p: Photo) => {
          try {
            const { data: signedData } = await supabase.storage
              .from('photos')
              .createSignedUrl(p.storage_path, 3600);
            return {
              ...p,
              signed_url: signedData?.signedUrl || '',
            };
          } catch {
            return p;
          }
        })
      );

      setPhotos(photosWithUrls);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedAlbumId, sortBy]);

  useEffect(() => {
    fetchAlbums();
    fetchPhotos();
  }, [fetchAlbums, fetchPhotos]);

  const handleDeletePhoto = async (photo: Photo) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      await supabase.storage.from('photos').remove([photo.storage_path]);
      await supabase.from('photos').delete().eq('id', photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Could not delete photo. Please try again.');
    }
  };

  const handleMoveAlbum = async (photo: Photo, targetAlbumId: string | null) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase
        .from('photos')
        .update({ album_id: targetAlbumId })
        .eq('id', photo.id);

      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, album_id: targetAlbumId } : p))
      );
    } catch (err) {
      console.error('Error moving photo:', err);
    }
  };

  const handleCreateAlbum = async (name: string, description: string) => {
    if (!user || !isSupabaseConfigured) return;
    const { error } = await supabase.from('albums').insert({
      user_id: user.id,
      name,
      description: description || null,
    });
    if (error) throw error;
    fetchAlbums();
  };

  const filteredPhotos = photos.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.file_name.toLowerCase().includes(q) ||
      (p.caption && p.caption.toLowerCase().includes(q))
    );
  });

  const currentAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="flex-1 bg-cream-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Remote Revocation Notification Alert */}
        {revocationMessage && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{revocationMessage}</span>
            </div>
            <button
              onClick={clearRevocationMessage}
              className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Header Bar */}
        <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
                {currentAlbum ? currentAlbum.name : 'Private Photo Vault'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Isolated Vault</span>
              </span>
            </div>
            <p className="text-xs text-brand-600">
              {currentAlbum?.description || 'All photos are protected with row-level security and signed URLs.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setAlbumModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-brand-900 border border-cream-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-caramel-600" />
              <span>New Album</span>
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-caramel-400" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>

        {/* Filters, Search & View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cream-card p-4 rounded-xl border border-cream-200">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by filename or caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-cream-100/70 border border-cream-300 rounded-lg text-xs text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-brand-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-cream-100/70 border border-cream-300 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-brand-600" />
              <select
                value={selectedAlbumId || ''}
                onChange={(e) => setSelectedAlbumId(e.target.value ? e.target.value : null)}
                className="bg-transparent text-brand-900 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="">All Vault Photos ({photos.length})</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-cream-100/70 border border-cream-300 rounded-lg px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                className="bg-transparent text-brand-900 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">File name</option>
              </select>
            </div>

            <button
              onClick={() => {
                fetchPhotos();
                fetchAlbums();
              }}
              title="Refresh Vault"
              className="p-2 rounded-lg text-brand-600 hover:text-brand-950 hover:bg-cream-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Photos Grid */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-caramel-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-brand-600 font-medium">Decrypting vault contents...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-cream-card rounded-2xl border border-cream-300 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-caramel-100 text-caramel-700 flex items-center justify-center mx-auto shadow-inner">
              <Images className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-brand-950">
                {searchQuery ? 'No matching photos found' : 'Your photo vault is currently empty'}
              </h3>
              <p className="text-xs text-brand-600 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with another keyword or clear your filter.'
                  : 'Start adding memories to your private vault. Photos uploaded here are strictly accessible to your account only.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 text-xs shadow-md transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-caramel-400" />
                <span>Upload First Photo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative bg-cream-card rounded-xl border border-cream-300 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer aspect-square flex flex-col justify-end"
              >
                <img
                  src={photo.signed_url}
                  alt={photo.caption || photo.file_name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3" />

                <div className="relative z-10 p-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-mono text-cream-200 bg-brand-950/70 px-1.5 py-0.5 rounded">
                    {(photo.file_size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <div className="w-6 h-6 rounded-full bg-brand-900/80 text-caramel-300 flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative z-10 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-semibold text-cream-50 truncate">
                    {photo.caption || photo.file_name}
                  </p>
                  <p className="text-[10px] text-cream-300">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <PhotoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onUploadSuccess={() => {
          fetchPhotos();
          fetchAlbums();
        }}
      />

      <AlbumModal
        isOpen={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
        onSave={handleCreateAlbum}
      />

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          albums={albums}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onDelete={handleDeletePhoto}
          onMoveAlbum={handleMoveAlbum}
        />
      )}
    </div>
  );
};
