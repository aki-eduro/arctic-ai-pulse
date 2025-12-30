import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ExternalLink, Bookmark, BookmarkCheck, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Article } from '@/types/database';

interface ArticleCardProps {
  article: Article;
  isBookmarked?: boolean;
  onToggleBookmark?: (articleId: string) => void;
  showBookmarkButton?: boolean;
}

const CATEGORY_CLASSES: Record<string, string> = {
  research: 'category-research',
  industry: 'category-industry',
  tools: 'category-tools',
  regulation: 'category-regulation',
  education: 'category-education',
};

const CATEGORY_LABELS: Record<string, string> = {
  research: 'Tutkimus',
  industry: 'Teollisuus',
  tools: 'Työkalut',
  regulation: 'Sääntely',
  education: 'Koulutus',
};

export function ArticleCard({
  article,
  isBookmarked = false,
  onToggleBookmark,
  showBookmarkButton = true,
}: ArticleCardProps) {
  const publishedAt = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: fi })
    : null;

  const scoreClass =
    article.score >= 70 ? 'score-high' : article.score >= 40 ? 'score-medium' : 'score-low';

  return (
    <article className="glass-card rounded-xl p-5 glow-hover animate-slide-up group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with category and score */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {article.source?.category && (
              <Badge
                variant="outline"
                className={CATEGORY_CLASSES[article.source.category] || 'bg-secondary'}
              >
                {CATEGORY_LABELS[article.source.category] || article.source.category}
              </Badge>
            )}
            {article.is_significant && (
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                Merkittävä
              </Badge>
            )}
            {article.score > 0 && (
              <Badge variant="outline" className={scoreClass}>
                {article.score}p
              </Badge>
            )}
          </div>

          {/* Title */}
          <Link to={`/article/${article.id}`} className="block group/title">
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover/title:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* Summary */}
          {article.summary_fi && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {article.summary_fi}
            </p>
          )}

          {/* Meta and Tags */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {article.source?.name && <span>{article.source.name}</span>}
              {publishedAt && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span>{publishedAt}</span>
                </>
              )}
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{article.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {showBookmarkButton && onToggleBookmark && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleBookmark(article.id)}
              className={isBookmarked ? 'text-primary' : 'text-muted-foreground'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
