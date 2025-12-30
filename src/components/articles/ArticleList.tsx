import { ArticleCard } from './ArticleCard';
import { Loader2 } from 'lucide-react';
import type { Article } from '@/types/database';

interface ArticleListProps {
  articles: Article[];
  isLoading?: boolean;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (articleId: string) => void;
  showBookmarkButton?: boolean;
  emptyMessage?: string;
}

export function ArticleList({
  articles,
  isLoading,
  bookmarkedIds = new Set(),
  onToggleBookmark,
  showBookmarkButton = true,
  emptyMessage = 'Ei artikkeleita.',
}: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article, index) => (
        <div
          key={article.id}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ArticleCard
            article={article}
            isBookmarked={bookmarkedIds.has(article.id)}
            onToggleBookmark={onToggleBookmark}
            showBookmarkButton={showBookmarkButton}
          />
        </div>
      ))}
    </div>
  );
}
