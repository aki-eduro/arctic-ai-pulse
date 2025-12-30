import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, ArrowRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Merkittävimmät</h2>
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
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Merkittävimmät</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ei vielä merkittäviä artikkeleita.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-accent';
    return 'text-muted-foreground';
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (index === 1) return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
    if (index === 2) return 'bg-amber-600/20 text-amber-500 border-amber-600/30';
    return 'bg-primary/20 text-primary border-primary/30';
  };

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Merkittävimmät</h2>
        </div>
        <Badge variant="outline" className="text-xs bg-muted/50">
          Top 5
        </Badge>
      </div>

      <div className="space-y-4">
        {articles.slice(0, 5).map((article, index) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="block group"
          >
            <div className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className={`flex items-center justify-center h-7 w-7 rounded-full border text-xs font-bold shrink-0 ${getMedalColor(index)}`}>
                {index < 3 ? <Star className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`text-xs bg-transparent border-transparent ${getScoreColor(article.score)}`}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {article.score} pistettä
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Merkittävyysarvo perustuu artikkelin vaikuttavuuteen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {article.source?.name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {article.source.name}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
