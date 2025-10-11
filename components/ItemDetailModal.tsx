import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Collectible, Comment, Album } from '../types';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import TrashIcon from './icons/TrashIcon';
import SendIcon from './icons/SendIcon';
import MessagesIcon from './icons/MessagesIcon';
import ImageIcon from './icons/ImageIcon';

interface ItemDetailModalProps {
  item: Collectible;
  session: Session;
  onClose: () => void;
  onDeleteSuccess: () => void;
  onStartConversation: (userId: string) => void;
  onItemUpdate: () => void;
}

const INITIAL_VISIBLE_COUNT = 3;
const FIRST_LOAD_MORE_COUNT = 4;
const SUBSEQUENT_LOAD_MORE_COUNT = 6;

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, session, onClose, onDeleteSuccess, onStartConversation, onItemUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCommentCount, setVisibleCommentCount] = useState(INITIAL_VISIBLE_COUNT);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(item.album_id || '');
  const [albumUpdateStatus, setAlbumUpdateStatus] = useState<'idle' | 'saving' | 'saved'>('idle');


  const isOwner = item.owner_id === session.user.id;
  
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOwner) {
        const fetchAlbums = async () => {
            const { data, error } = await supabase
                .from('albums')
                .select('*')
                .eq('owner_id', session.user.id)
                .order('name', { ascending: true });
            if (error) {
                console.error("Error fetching albums for modal:", error);
            } else if (isMounted.current) {
                setAlbums(data);
            }
        };
        fetchAlbums();
    }
  }, [isOwner, session.user.id]);

  const handleAlbumChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAlbumId = e.target.value;
    setSelectedAlbumId(newAlbumId);
    setAlbumUpdateStatus('saving');

    const { error } = await supabase
      .from('collectibles')
      .update({ album_id: newAlbumId === '' ? null : newAlbumId })
      .eq('id', item.id);

    if (isMounted.current) {
        if (error) {
            console.error("Error updating album:", error);
            setAlbumUpdateStatus('idle'); // Or 'error'
        } else {
            setAlbumUpdateStatus('saved');
            onItemUpdate(); // Refresh collection view
            setTimeout(() => {
                if(isMounted.current) setAlbumUpdateStatus('idle');
            }, 2000);
        }
    }
  };

  const fetchComments = useCallback(async (showAll: boolean = false) => {
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
      setComments([]);
      setLoadingComments(false);
      return;
    }

    if (commentsData && commentsData.length > 0) {
      const ownerIds = [...new Set(commentsData.map(c => c.owner_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, handle, avatar_url')
        .in('id', ownerIds);

      let combinedData: Comment[];
      if (profilesError) {
        console.error('Error fetching profiles for comments:', profilesError.message);
        combinedData = commentsData.map(c => ({...c, profiles: null})) as Comment[];
      } else {
        const profilesMap = new Map(profilesData.map(p => [p.id, p]));
        combinedData = commentsData.map(c => ({
          ...c,
          profiles: profilesMap.get(c.owner_id) || null
        })) as Comment[];
      }
      setComments(combinedData);
      if (showAll) {
        setVisibleCommentCount(combinedData.length);
      } else {
        setVisibleCommentCount(INITIAL_VISIBLE_COUNT);
      }
    } else {
      setComments([]);
    }
    setLoadingComments(false);
  }, [item.id]);

  useEffect(() => {
    fetchComments(false);
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
        await fetchComments(true); // Refetch and show all comments
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
  
  const handleLoadMore = () => {
    setVisibleCommentCount(currentCount => {
      const isFirstLoadMore = currentCount === INITIAL_VISIBLE_COUNT;
      const numToAdd = isFirstLoadMore ? FIRST_LOAD_MORE_COUNT : SUBSEQUENT_LOAD_MORE_COUNT;
      const newCount = currentCount + numToAdd;
      return Math.min(newCount, comments.length);
    });
  };

  const displayedComments = comments.slice(Math.max(0, comments.length - visibleCommentCount));


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-base-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-full md:w-1/2 flex-shrink-0 bg-base-300 md:rounded-l-2xl md:rounded-r-none rounded-t-2xl">
            {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover md:rounded-l-2xl md:rounded-r-none rounded-t-2xl" />
            ) : (
                <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-base-content/20" />
                </div>
            )}
        </div>
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <div className="flex-shrink-0">
            <span className="inline-block bg-base-300 rounded-full px-3 py-1 text-sm font-semibold mb-2">{item.category}</span>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="text-lg text-base-content/80 mt-1">{item.country}, {item.year}</p>
            <p className="mt-6 text-base-content/90">{item.description}</p>
            {isOwner && (
                <div className="mt-6">
                    <label htmlFor="album" className="text-sm font-medium text-base-content/80">Альбом</label>
                    <div className="flex items-center gap-2">
                        <select
                            id="album"
                            value={selectedAlbumId}
                            onChange={handleAlbumChange}
                            className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            <option value="">Без альбома</option>
                            {albums.map(album => (
                                <option key={album.id} value={album.id}>{album.name}</option>
                            ))}
                        </select>
                        <div className="w-24 text-center text-sm">
                            {albumUpdateStatus === 'saving' && <span className="text-base-content/70">Сохранение...</span>}
                            {albumUpdateStatus === 'saved' && <span className="text-green-500 font-semibold">Сохранено!</span>}
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-8 flex items-center gap-4">
              {isOwner ? (
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 bg-red-500/20 text-red-500 hover:bg-red-500/40 font-semibold py-2 px-5 rounded-full text-sm transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>{isDeleting ? 'Удаление...' : 'Удалить'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => onStartConversation(item.owner_id)}
                  className="flex items-center gap-2 bg-primary/80 text-black hover:bg-primary font-semibold py-2 px-5 rounded-full text-sm transition-colors"
                >
                  <MessagesIcon className="w-4 h-4" />
                  <span>Написать владельцу</span>
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
                <>
                  {visibleCommentCount < comments.length && (
                    <div className="text-center py-2">
                        <button onClick={handleLoadMore} className="text-sm font-semibold text-primary hover:underline">
                            Показать предыдущие комментарии
                        </button>
                    </div>
                  )}
                  {displayedComments.map(comment => (
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
                  ))}
                </>
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
                    <button type="submit" disabled={isSubmitting || !newComment.trim()} className="px-4 py-1.5 rounded-full text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2">
                      <SendIcon className="w-4 h-4" />
                      <span>{isSubmitting ? 'Отправка...' : 'Отправить'}</span>
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