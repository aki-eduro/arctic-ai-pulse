import { Link } from 'react-router-dom';
import { Sparkles, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">AI Uutisvahti</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Tekoälyuutiset suomeksi – seuraa alan kehitystä yhdestä paikasta.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Linkit</h3>
            <nav className="flex flex-col gap-2">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Etusivu
              </Link>
              <Link 
                to="/bookmarks" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Kirjanmerkit
              </Link>
              <a 
                href="https://laplandailab.fi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                Lapland AI Lab
                <ExternalLink className="h-3 w-3" />
              </a>
            </nav>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Tietoa</h3>
            <p className="text-sm text-muted-foreground">
              AI Uutisvahti on Lapland AI Labin kehittämä palvelu, joka kokoaa ja tiivistää 
              tärkeimmät tekoälyuutiset automaattisesti suomeksi.
            </p>
            <a 
              href="https://github.com/laplandailab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center">
            © {currentYear} Lapland AI Lab. Kaikki oikeudet pidätetään.
          </p>
        </div>
      </div>
    </footer>
  );
}
