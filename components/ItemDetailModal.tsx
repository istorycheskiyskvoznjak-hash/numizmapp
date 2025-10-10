import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Collectible, Comment } from '../types';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface ItemDetailModalProps {
  item: Collectible;
  session: Session;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, session, onClose, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const isOwner = item.owner_id === session.user.id;
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    setCommentError(null);

    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('collectible_id', item.id)
      .order('created_at', { ascending: true });

    if (!isMounted.current) return;

    if (commentsError) {
      console.error('Error fetching comments:', commentsError.message);
      setCommentError('Не удалось загрузить комментарии.');
      setLoadingComments(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoadingComments(false);
      return;
    }

    const ownerIds = [...new Set(commentsData.map(c => c.owner_id))];

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, handle, avatar_url')
      .in('id', ownerIds);
      
    if (!isMounted.current) return;

    if (profilesError) {
      console.error('Error fetching profiles for comments:', profilesError.message);
      setComments(commentsData as any[] as Comment[]);
    } else {
      const profilesMap = new Map(profilesData.map(p => [p.id, p]));
      const combinedData = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.owner_id) || null,
      }));
      setComments(combinedData as any[] as Comment[]);
    }

    setLoadingComments(false);
  }, [item.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setCommentError(null);

    const { error } = await supabase
      .from('comments')
      .insert({
        text: newComment,
        owner_id: session.user.id,
        collectible_id: item.id,
      });

    if (isMounted.current) {
      if (error) {
        console.error('Error submitting comment:', error.message);
        setCommentError('Не удалось отправить комментарий.');
      } else {
        setNewComment('');
        await fetchComments();
      }
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    const confirmed = window.confirm(`Вы уверены, что хотите удалить "${item.name}"? Это действие необратимо.`);
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('collectibles')
        .delete()
        .eq('id', item.id);
      
      if (deleteError) throw deleteError;

      if (item.image_url) {
        try {
            const imageUrl = new URL(item.image_url);
            const filePath = imageUrl.pathname.split('/').slice(2).join('/');
            
            const { error: storageError } = await supabase
              .storage
              .from('collectibles')
              .remove([filePath]);
      
            if (storageError) {
              console.error("Could not delete item from storage, but DB record was deleted:", storageError.message);
            }
        } catch (e) {
            console.error("Invalid image URL, skipping storage deletion:", item.image_url, e);
        }
      }
      
      onDeleteSuccess();
    } catch (err: any) {
      console.error("Error deleting item:", err);
      if (isMounted.current) {
        setError(err.message || "Не удалось удалить предмет.");
      }
    } finally {
      if (isMounted.current) {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-base-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-full md:w-1/2 flex-shrink-0 bg-base-300">
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover md:rounded-l-2xl md:rounded-r-none rounded-t-2xl" />
        </div>
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <div className="flex-shrink-0">
            <span className="inline-block bg-base-300 rounded-full px-3 py-1 text-sm font-semibold mb-2">{item.category}</span>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="text-lg text-base-content/80 mt-1">{item.country}, {item.year}</p>
            <p className="mt-6 text-base-content/90">{item.description}</p>
            <div className="mt-8">
              {isOwner && (
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500/20 text-red-500 hover:bg-red-500/40 font-semibold py-2 px-5 rounded-full text-sm transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </button>
              )}
              {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
            </div>
          </div>
          
          <div className="border-t border-base-300 my-6"></div>

          <div className="flex-grow flex flex-col min-h-0">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Комментарии ({comments.length})</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
              {loadingComments ? (
                <p className="text-sm text-base-content/60">Загрузка комментариев...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-base-content/60">Комментариев пока нет. Будьте первым!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <img src={comment.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${comment.owner_id}`} alt={comment.profiles?.name} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1 bg-base-100 p-3 rounded-lg">
                      <div className="flex items-baseline space-x-2 text-sm">
                        <span className="font-bold">{comment.profiles?.name || 'User'}</span>
                        <span className="text-base-content/60">@{comment.profiles?.handle || '...'}</span>
                      </div>
                      <p className="mt-1 text-sm text-base-content/90">{comment.text}</p>
                      <p className="mt-2 text-xs text-base-content/50">{new Date(comment.created_at).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                ))
              )}
              {commentError && <p className="text-sm text-red-500">{commentError}</p>}
            </div>

            <div className="mt-auto pt-4 border-t border-base-300 flex-shrink-0">
              <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
                <img src={session.user.user_metadata.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`} alt="Ваш аватар" className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Написать комментарий..."
                    className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-lg text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    rows={2}
                    disabled={isSubmitting}
                    aria-label="Ваш комментарий"
                  />
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={isSubmitting || !newComment.trim()} className="px-4 py-1.5 rounded-full text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50">
                      {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;