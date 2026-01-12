import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Calendar,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Article as ArticleType } from '@/types/database';

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

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [article, setArticle] = useState<ArticleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, source:sources(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setArticle(data as ArticleType);
      } catch (error) {
        console.error('Error fetching article:', error);
        toast({
          title: 'Virhe',
          description: 'Artikkelin lataaminen epäonnistui.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id, toast]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (!user || !id) return;

      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', id)
        .single();

      setIsBookmarked(!!data);
    };

    checkBookmark();
  }, [user, id]);

  const handleToggleBookmark = async () => {
    if (!user || !id) {
      toast({
        title: 'Kirjaudu sisään',
        description: 'Kirjaudu sisään tallentaaksesi kirjanmerkkejä.',
      });
      return;
    }

    try {
      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', id);
        setIsBookmarked(false);
      } else {
        await supabase.from('bookmarks').insert({
          user_id: user.id,
          article_id: id,
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: 'Virhe',
        description: 'Kirjanmerkin päivittäminen epäonnistui.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Artikkelia ei löytynyt</h1>
          <p className="text-muted-foreground mb-4">
            Hakemaasi artikkelia ei ole olemassa.
          </p>
          <Button asChild>
            <Link to="/">Palaa etusivulle</Link>
          </Button>
        </div>
      </div>
    );
  }

  const scoreClass =
    article.score >= 70 ? 'score-high' : article.score >= 40 ? 'score-medium' : 'score-low';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl px-4 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Takaisin uutisiin
        </Link>

        <article className="animate-fade-in">
          {/* Header */}
          <header className="mb-8">
            {/* Meta badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                  {article.score} pistettä
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Source and Date */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {article.source?.name && <span>{article.source.name}</span>}
              {article.published_at && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(article.published_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Summary */}
          {article.summary_fi && (
            <div className="glass-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Tiivistelmä</h2>
              <p className="text-foreground/90 leading-relaxed">{article.summary_fi}</p>
            </div>
          )}

          {/* Why it matters */}
          {article.why_it_matters && (
            <div className="glass-card rounded-xl p-6 mb-6 border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Miksi tämä on tärkeää</h2>
              </div>
              <p className="text-foreground/90 leading-relaxed">{article.why_it_matters}</p>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Tagit</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Lue alkuperäinen artikkeli
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleBookmark}
              className={isBookmarked ? 'text-primary border-primary' : ''}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Tallennettu
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Tallenna
                </>
              )}
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
