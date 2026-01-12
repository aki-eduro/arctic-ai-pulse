import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { HeroSection } from '@/components/layout/HeroSection';
import { FilterSidebar } from '@/components/layout/FilterSidebar';
import { ArticleList } from '@/components/articles/ArticleList';
import { Button } from '@/components/ui/button';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [topBreakthroughs, setTopBreakthroughs] = useState<Article[]>([]);
  const [isTopBreakthroughsLoading, setIsTopBreakthroughsLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<ArticleCategory[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showSignificantOnly, setShowSignificantOnly] = useState(false);

  const PAGE_SIZE = 30;

  const fetchArticlesPage = async (pageIndex: number, replace = false) => {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('articles')
      .select('*, source:sources(*)')
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const nextArticles = (data as Article[]) || [];
    setArticles((prev) => (replace ? nextArticles : [...prev, ...nextArticles]));
    setHasMore(nextArticles.length === PAGE_SIZE);
  };

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        await fetchArticlesPage(0, true);
        setPage(0);
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

  // Fetch top breakthroughs
  useEffect(() => {
    const fetchTopBreakthroughs = async () => {
      setIsTopBreakthroughsLoading(true);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, source:sources(*)')
          .order('score', { ascending: false })
          .limit(10);

        if (error) throw error;
        const nextArticles = (data as Article[]) || [];
        setTopBreakthroughs(
          nextArticles.filter((article) => article.score > 0).slice(0, 5)
        );
      } catch (error) {
        console.error('Error fetching top breakthroughs:', error);
        toast({
          title: 'Virhe',
          description: 'Läpimurtojen lataaminen epäonnistui.',
          variant: 'destructive',
        });
      } finally {
        setIsTopBreakthroughsLoading(false);
      }
    };

    fetchTopBreakthroughs();
  }, [toast]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      await fetchArticlesPage(nextPage);
      setPage(nextPage);
    } catch (error) {
      console.error('Error fetching more articles:', error);
      toast({
        title: 'Virhe',
        description: 'Lisäartikkeleiden lataaminen epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

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

  // Significant articles count
  const significantCount = useMemo(() => {
    return articles.filter((a) => a.is_significant).length;
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

  // Active filters count
  const activeFiltersCount = 
    selectedCategories.length + 
    (selectedTimeRange !== 'all' ? 1 : 0) + 
    (showSignificantOnly ? 1 : 0);

  return (
    <AppShell headerProps={{ onSearch: handleSearch, searchQuery }}>
      {/* Hero Section */}
      <HeroSection articleCount={articles.length} significantCount={significantCount} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Filters */}
        <FilterSidebar
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedTimeRange={selectedTimeRange}
          onTimeRangeChange={setSelectedTimeRange}
          showSignificantOnly={showSignificantOnly}
          onSignificantOnlyChange={setShowSignificantOnly}
          onClearFilters={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Uusimmat artikkelit
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredArticles.length} artikkelia
              {searchQuery && ` haulla "${searchQuery}"`}
              {activeFiltersCount > 0 && ` (${activeFiltersCount} suodatin aktiivinen)`}
            </p>
          </div>

          <ArticleList
            articles={filteredArticles}
            isLoading={isLoading}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            emptyMessage="Ei artikkeleita valituilla suodattimilla."
          />

          {!isLoading && hasMore && (
            <div className="mt-8 flex justify-center">
              <Button onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Ladataan lisää...' : 'Lataa lisää'}
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Top Breakthroughs */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24">
            <TopBreakthroughs
              articles={topBreakthroughs}
              isLoading={isTopBreakthroughsLoading}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
