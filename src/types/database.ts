export type ArticleCategory = 'research' | 'industry' | 'tools' | 'regulation' | 'education';
export type AppRole = 'admin' | 'reader';

export interface Source {
  id: string;
  name: string;
  rss_url: string;
  category: ArticleCategory;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  source_id: string;
  title: string;
  url: string;
  guid: string | null;
  published_at: string | null;
  raw_excerpt: string | null;
  summary_fi: string | null;
  why_it_matters: string | null;
  tags: string[];
  score: number;
  is_significant: boolean;
  created_at: string;
  updated_at: string;
  source?: Source;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface UserTagFollow {
  id: string;
  user_id: string;
  tag: string;
  created_at: string;
}
