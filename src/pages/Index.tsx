import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FilterSidebar } from '@/components/layout/FilterSidebar';
import { ArticleList } from '@/components/articles/ArticleList';
import { TopBreakthroughs } from '@/components/articles/TopBreakthroughs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Article, ArticleCategory } from '@/types/database';

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<ArticleCategory[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showSignificantOnly, setShowSignificantOnly] = useState(false);

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, source:sources(*)')
          .order('published_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setArticles((data as Article[]) || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
        toast({
          title: 'Virhe',
          description: 'Artikkeleiden lataaminen epäonnistui.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [toast]);

  // Fetch bookmarks
  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      return;
    }

    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('article_id')
        .eq('user_id', user.id);

      if (data) {
        setBookmarkedIds(new Set(data.map((b) => b.article_id)));
      }
    };

    fetchBookmarks();
  }, [user]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.summary_fi?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((a) =>
        selectedCategories.includes(a.source?.category as ArticleCategory)
      );
    }

    // Time range filter
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (selectedTimeRange) {
        case '24h':
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      filtered = filtered.filter(
        (a) => a.published_at && new Date(a.published_at) >= cutoff
      );
    }

    // Significant only filter
    if (showSignificantOnly) {
      filtered = filtered.filter((a) => a.is_significant);
    }

    return filtered;
  }, [articles, searchQuery, selectedCategories, selectedTimeRange, showSignificantOnly]);

  // Top breakthroughs
  const topBreakthroughs = useMemo(() => {
    return [...articles]
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [articles]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  // Handle bookmark toggle
  const handleToggleBookmark = async (articleId: string) => {
    if (!user) {
      toast({
        title: 'Kirjaudu sisään',
        description: 'Kirjaudu sisään tallentaaksesi kirjanmerkkejä.',
      });
      return;
    }

    const isCurrentlyBookmarked = bookmarkedIds.has(articleId);

    try {
      if (isCurrentlyBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);

        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
      } else {
        await supabase.from('bookmarks').insert({
          user_id: user.id,
          article_id: articleId,
        });

        setBookmarkedIds((prev) => new Set([...prev, articleId]));
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

  // Clear filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedTimeRange('all');
    setShowSignificantOnly(false);
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />

      <main className="container px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <FilterSidebar
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            selectedTimeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            showSignificantOnly={showSignificantOnly}
            onSignificantOnlyChange={setShowSignificantOnly}
            onClearFilters={handleClearFilters}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Uusimmat AI-uutiset
              </h1>
              <p className="text-muted-foreground">
                {filteredArticles.length} artikkelia
                {searchQuery && ` haulla "${searchQuery}"`}
              </p>
            </div>

            <ArticleList
              articles={filteredArticles}
              isLoading={isLoading}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              emptyMessage="Ei artikkeleita valituilla suodattimilla."
            />
          </div>

          {/* Right Sidebar - Top Breakthroughs */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-24">
              <TopBreakthroughs articles={topBreakthroughs} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
