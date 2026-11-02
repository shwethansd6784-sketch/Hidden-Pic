import React, { useState, useEffect } from 'react';
import { X, FolderPlus, FolderEdit, Loader2 } from 'lucide-react';
import type { Album } from '../types';

interface AlbumModalProps {
  isOpen: boolean;
  albumToEdit?: Album | null;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}

export const AlbumModal: React.FC<AlbumModalProps> = ({
  isOpen,
  albumToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (albumToEdit) {
      setName(albumToEdit.name);
      setDescription(albumToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError(null);
  }, [albumToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an album name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to save album');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-cream-50 rounded-2xl shadow-2xl border border-cream-300 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between bg-cream-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-caramel-100 text-caramel-700 flex items-center justify-center">
              {albumToEdit ? <FolderEdit className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <h3 className="font-serif font-bold text-lg text-brand-950">
              {albumToEdit ? 'Rename Album' : 'Create New Album'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-brand-500 hover:text-brand-900 hover:bg-cream-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1.5">
              Album Name <span className="text-caramel-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Summer Vacation, Family Memories, Private"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream-100/70 border border-cream-300 rounded-xl text-sm text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add details or notes for this collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-cream-100/70 border border-cream-300 rounded-xl text-sm text-brand-950 focus:bg-cream-50 focus:ring-2 focus:ring-caramel-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-brand-800 hover:bg-cream-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-brand-900 hover:bg-brand-850 text-cream-50 rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-caramel-400" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{albumToEdit ? 'Save Changes' : 'Create Album'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
