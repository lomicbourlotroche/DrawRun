'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { api } from '@/lib/api';
import { MessageCircle, X, Loader2 } from '@/components/ui/icons';
import { toast } from 'sonner';

interface CommentModalProps {
  activityId: number;
  ownerId?: number;
  onClose: () => void;
  onCommentCountChange: (_delta: number) => void;
}

export default function CommentModal({ activityId, ownerId, onClose, onCommentCountChange }: CommentModalProps) {
  const [comments, setComments] = useState<
    Array<{ id: number; content: string; user_name: string; created_at: string }>
  >([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);

  useState(() => {
    (async () => {
      try {
        const data = await api.getActivityComments(activityId);
        setComments((data as Array<{ id: number; content: string; user_name: string; created_at: string }>) || []);
      } catch {
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    })();
  });

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsPostingComment(true);
    try {
      await api.addComment(activityId, commentText.trim(), ownerId);
      toast.success('Commentaire ajouté');
      setCommentText('');
      const data = await api.getActivityComments(activityId);
      setComments((data as Array<{ id: number; content: string; user_name: string; created_at: string }>) || []);
      onCommentCountChange(1);
    } catch {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <ModalSheet open onClose={onClose} withFlex>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <MessageCircle className="w-4 h-4 text-primary" />
          Commentaires
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted" />
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3 min-h-[120px]">
        {isLoadingComments ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted opacity-30" />
            <p className="text-sm text-muted">Aucun commentaire — soyez le premier !</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.user_name} size="sm" />
              <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{c.user_name}</p>
                <p className="text-sm text-foreground mt-0.5">{c.content || '(Aucun contenu)'}</p>
                <p className="text-xs text-muted mt-1">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="px-4 sm:px-5 py-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
            placeholder="Écrire un commentaire..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[44px]"
            autoFocus
          />
          <button
            onClick={handlePostComment}
            disabled={!commentText.trim() || isPostingComment}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
