import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderLock,
  Plus,
  FolderEdit,
  Trash2,
  Images,
  FolderPlus,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Album } from '../types';
import { AlbumModal } from '../components/AlbumModal';

export const AlbumsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

  const fetchAlbumsWithCounts = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (albumError) throw albumError;

      const albumsWithCount = await Promise.all(
        (albumData || []).map(async (alb: Album) => {
          const { count } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', alb.id);

          const { data: latestPhoto } = await supabase
            .from('photos')
            .select('storage_path')
            .eq('album_id', alb.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let coverUrl: string | null = null;
          if (latestPhoto?.storage_path) {
            const { data: signedData } = await supabase.storage
              .from('photos')
              .createSignedUrl(latestPhoto.storage_path, 3600);
            coverUrl = signedData?.signedUrl || null;
          }

          return {
            ...alb,
            photo_count: count || 0,
            cover_url: coverUrl,
          };
        })
      );

      setAlbums(albumsWithCount);
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlbumsWithCounts();
  }, [fetchAlbumsWithCounts]);

  const handleSaveAlbum = async (name: string, description: string) => {
    if (!user || !isSupabaseConfigured) return;

    if (albumToEdit) {
      const { error } = await supabase
        .from('albums')
        .update({ name, description: description || null, updated_at: new Date().toISOString() })
        .eq('id', albumToEdit.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('albums').insert({
        user_id: user.id,
        name,
        description: description || null,
      });
      if (error) throw error;
    }

    setAlbumToEdit(null);
    fetchAlbumsWithCounts();
  };

  const handleDeleteAlbum = async () => {
    if (!albumToDelete || !isSupabaseConfigured) return;

    try {
      await supabase.from('albums').delete().eq('id', albumToDelete.id);
      setAlbumToDelete(null);
      fetchAlbumsWithCounts();
    } catch (err) {
      console.error('Failed to delete album:', err);
      alert('Could not delete album.');
    }
  };

  return (
    <div className="flex-1 bg-cream-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-300 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-950">
              Private Photo Albums
            </h1>
            <p className="text-xs text-brand-600">
              Organize your hidden photographs into personal collections and private folders.
            </p>
          </div>

          <button
            onClick={() => {
              setAlbumToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 shadow-md transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <FolderPlus className="w-4 h-4 text-caramel-400" />
            <span>Create New Album</span>
          </button>
        </div>

        {/* Albums Grid */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-caramel-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-brand-600 font-medium">Loading albums...</p>
          </div>
        ) : albums.length === 0 ? (
          <div className="bg-cream-card rounded-2xl border border-cream-300 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-caramel-100 text-caramel-700 flex items-center justify-center mx-auto shadow-inner">
              <FolderLock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-brand-950">No albums created yet</h3>
              <p className="text-xs text-brand-600 max-w-sm mx-auto">
                Create albums to group trips, family moments, or sensitive photographs together.
              </p>
            </div>
            <button
              onClick={() => {
                setAlbumToEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-caramel-400" />
              <span>Create Your First Album</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-cream-card rounded-2xl border border-cream-300 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div
                  onClick={() => navigate(`/vault?album=${album.id}`)}
                  className="w-full h-44 bg-cream-200 relative overflow-hidden cursor-pointer"
                >
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-brand-400 bg-gradient-to-br from-cream-100 to-cream-200">
                      <FolderLock className="w-10 h-10 text-caramel-500/70 mb-1" />
                      <span className="text-[11px] font-medium text-brand-500">Empty Collection</span>
                    </div>
                  )}

                  <span className="absolute bottom-2.5 right-2.5 bg-brand-950/80 text-cream-100 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Images className="w-3 h-3 text-caramel-400" />
                    <span>{album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}</span>
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => navigate(`/vault?album=${album.id}`)}
                      className="font-serif font-bold text-base text-brand-950 hover:text-caramel-600 transition truncate cursor-pointer"
                    >
                      {album.name}
                    </h3>
                    <p className="text-xs text-brand-600 line-clamp-2 mt-0.5">
                      {album.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
                    <span className="text-[10px] text-brand-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-caramel-500" />
                      {new Date(album.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setAlbumToEdit(album);
                          setIsModalOpen(true);
                        }}
                        title="Rename Album"
                        className="p-1.5 rounded-lg text-brand-600 hover:text-brand-950 hover:bg-cream-200 transition cursor-pointer"
                      >
                        <FolderEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setAlbumToDelete(album)}
                        title="Delete Album"
                        className="p-1.5 rounded-lg text-brand-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      <AlbumModal
        isOpen={isModalOpen}
        albumToEdit={albumToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setAlbumToEdit(null);
        }}
        onSave={handleSaveAlbum}
      />

      {albumToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-cream-50 text-brand-950 p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-cream-300">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-base text-brand-950 mb-1">
              Delete Album “{albumToDelete.name}”?
            </h4>
            <p className="text-xs text-brand-700 leading-relaxed mb-5">
              Deleting this album will not delete your photos. The photos will safely remain in your main photo vault without an assigned album.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAlbumToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-brand-800 hover:bg-cream-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAlbum}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
              >
                Yes, Delete Album
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
