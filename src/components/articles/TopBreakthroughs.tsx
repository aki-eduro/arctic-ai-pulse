import { Link } from 'react-router-dom';
import { Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Article } from '@/types/database';

interface TopBreakthroughsProps {
  articles: Article[];
  isLoading?: boolean;
}

export function TopBreakthroughs({ articles, isLoading }: TopBreakthroughsProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Top 5 Läpimurrot</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted/50 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Top 5 Läpimurrot</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ei vielä merkittäviä läpimurtoja tänään.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary animate-pulse-glow" />
        <h2 className="font-semibold text-foreground">Top 5 Läpimurrot</h2>
      </div>

      <div className="space-y-4">
        {articles.slice(0, 5).map((article, index) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="block group"
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 text-primary border-primary/30"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {article.score}p
                  </Badge>
                  {article.source?.name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {article.source.name}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
