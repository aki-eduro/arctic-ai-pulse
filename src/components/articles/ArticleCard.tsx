import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ExternalLink, Bookmark, BookmarkCheck, TrendingUp, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [imageError, setImageError] = useState(false);
  
  const publishedAt = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: fi })
    : null;

  const getScoreInfo = (score: number) => {
    if (score >= 70) return { class: 'score-high', label: 'Erittäin merkittävä' };
    if (score >= 40) return { class: 'score-medium', label: 'Merkittävä' };
    return { class: 'score-low', label: 'Tavanomainen' };
  };

  const scoreInfo = getScoreInfo(article.score);
  
  // Use Finnish title if available, otherwise fall back to original
  const displayTitle = article.title_fi || article.title;
  const hasImage = article.image_url && !imageError;

  return (
    <article className={`glass-card rounded-xl overflow-hidden glow-hover animate-slide-up group relative ${article.is_significant ? 'ring-1 ring-primary/30' : ''}`}>
      {/* Significant indicator */}
      {article.is_significant && (
        <div className="absolute -top-px left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-10" />
      )}

      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        {hasImage && (
          <div className="sm:w-48 md:w-56 shrink-0">
            <div className="relative h-40 sm:h-full w-full bg-muted overflow-hidden">
              <img
                src={article.image_url!}
                alt={displayTitle}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent sm:bg-gradient-to-r" />
            </div>
          </div>
        )}

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header with category and score */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {article.source?.category && (
                  <Badge
                    variant="outline"
                    className={CATEGORY_CLASSES[article.source.category] || 'bg-secondary'}
                  >
                    {CATEGORY_LABELS[article.source.category] || article.source.category}
                  </Badge>
                )}
                {article.is_significant && (
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Merkittävä
                  </Badge>
                )}
                {article.score > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={scoreInfo.class}>
                          {article.score} pistettä
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{scoreInfo.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Title - Finnish if available */}
              <Link to={`/article/${article.id}`} className="block group/title">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover/title:text-primary transition-colors line-clamp-2">
                  {displayTitle}
                </h3>
              </Link>
              
              {/* Show original title if we're displaying Finnish */}
              {article.title_fi && (
                <p className="text-xs text-muted-foreground/70 mb-2 line-clamp-1 italic">
                  {article.title}
                </p>
              )}

              {/* Summary */}
              {article.summary_fi && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                  {article.summary_fi}
                </p>
              )}

              {/* Why it matters */}
              {article.why_it_matters && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20 mb-3">
                  <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-foreground/80 line-clamp-2">
                    {article.why_it_matters}
                  </p>
                </div>
              )}

              {/* Meta and Tags */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {article.source?.name && (
                    <span className="font-medium">{article.source.name}</span>
                  )}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? 'Poista kirjanmerkki' : 'Lisää kirjanmerkki'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Avaa alkuperäinen artikkeli</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
