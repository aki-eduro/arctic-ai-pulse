import { Sparkles, TrendingUp, Newspaper } from 'lucide-react';

interface HeroSectionProps {
  articleCount: number;
  significantCount: number;
}

export function HeroSection({ articleCount, significantCount }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-border/50 p-6 md:p-8 mb-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">AI Uutisvahti</span>
        </div>

        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
          Tekoälyuutiset suomeksi
        </h1>

        <p className="text-muted-foreground max-w-2xl mb-6">
          Seuraa tekoälyn kehitystä yhdestä paikasta. Kokoamme ja tiivistämme 
          tärkeimmät AI-uutiset automaattisesti suomeksi – tutkimuksesta teollisuuteen.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 md:gap-6">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
            <Newspaper className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{articleCount}</span>
              <span className="text-muted-foreground ml-1">artikkelia</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{significantCount}</span>
              <span className="text-muted-foreground ml-1">merkittävää</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
