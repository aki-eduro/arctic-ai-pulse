import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings, Bookmark, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSearch, searchQuery = '' }: HeaderProps) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(localSearch);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <span className="text-primary font-bold text-lg">AI</span>
            <div className="absolute inset-0 rounded-lg ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">AI Uutisvahti</h1>
            <p className="text-xs text-muted-foreground">Lapland AI Lab</p>
          </div>
        </Link>

        {/* Search - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Hae uutisia..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </form>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="h-5 w-5" />
                  {isAdmin && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/bookmarks" className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Kirjanmerkit
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Hallinta
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Kirjaudu ulos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">Kirjaudu</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="container px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Hae uutisia..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>
            </form>

            {/* Mobile Nav Items */}
            <nav className="space-y-2">
              {user ? (
                <>
                  <Link
                    to="/bookmarks"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bookmark className="h-4 w-4" />
                    Kirjanmerkit
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Hallinta
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary text-destructive w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Kirjaudu ulos
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Kirjaudu sisään
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
