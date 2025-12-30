import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { ArticleList } from '@/components/articles/ArticleList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@/types/database';

export default function Bookmarks() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('article_id, article:articles(*, source:sources(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const bookmarkedArticles = data
          ?.map((b) => b.article as Article | null)
          .filter((a): a is Article => a !== null) || [];

        setArticles(bookmarkedArticles);
        setBookmarkedIds(new Set(bookmarkedArticles.map((a) => a.id)));
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        toast({
          title: 'Virhe',
          description: 'Kirjanmerkkien lataaminen epäonnistui.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, toast]);

  const handleToggleBookmark = async (articleId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId);

      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });

      toast({
        title: 'Poistettu',
        description: 'Artikkeli poistettu kirjanmerkeistä.',
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast({
        title: 'Virhe',
        description: 'Kirjanmerkin poistaminen epäonnistui.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Takaisin uutisiin
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Kirjanmerkit</h1>
          <p className="text-muted-foreground">
            {articles.length} tallennettua artikkelia
          </p>
        </div>

        <ArticleList
          articles={articles}
          isLoading={isLoading}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          emptyMessage="Ei tallennettuja artikkeleita."
        />
      </main>
    </div>
  );
}
