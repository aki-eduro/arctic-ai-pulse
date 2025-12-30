import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ArticleCategory } from '@/types/database';

interface FilterSidebarProps {
  selectedCategories: ArticleCategory[];
  onCategoriesChange: (categories: ArticleCategory[]) => void;
  selectedTimeRange: string;
  onTimeRangeChange: (range: string) => void;
  showSignificantOnly: boolean;
  onSignificantOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
  activeFiltersCount?: number;
}

const CATEGORIES: { value: ArticleCategory; label: string; className: string }[] = [
  { value: 'research', label: 'Tutkimus', className: 'category-research' },
  { value: 'industry', label: 'Teollisuus', className: 'category-industry' },
  { value: 'tools', label: 'Työkalut', className: 'category-tools' },
  { value: 'regulation', label: 'Sääntely', className: 'category-regulation' },
  { value: 'education', label: 'Koulutus', className: 'category-education' },
];

const TIME_RANGES = [
  { value: 'all', label: 'Kaikki' },
  { value: '24h', label: 'Viimeiset 24 tuntia' },
  { value: '7d', label: 'Viimeiset 7 päivää' },
  { value: '30d', label: 'Viimeiset 30 päivää' },
];

function FilterContent({
  selectedCategories,
  onCategoriesChange,
  selectedTimeRange,
  onTimeRangeChange,
  showSignificantOnly,
  onSignificantOnlyChange,
  onClearFilters,
}: Omit<FilterSidebarProps, 'activeFiltersCount'>) {
  const toggleCategory = (category: ArticleCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedTimeRange !== 'all' || showSignificantOnly;

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Tyhjennä suodattimet
        </Button>
      )}

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Kategoriat</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant="outline"
              className={`cursor-pointer transition-all ${
                selectedCategories.includes(cat.value)
                  ? cat.className
                  : 'bg-transparent hover:bg-secondary'
              }`}
              onClick={() => toggleCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Aikaväli</h3>
        <Select value={selectedTimeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Significant Only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="significant"
          checked={showSignificantOnly}
          onCheckedChange={(checked) => onSignificantOnlyChange(checked as boolean)}
        />
        <Label htmlFor="significant" className="text-sm cursor-pointer">
          Näytä vain merkittävät
        </Label>
      </div>
    </div>
  );
}

export function FilterSidebar({
  selectedCategories,
  onCategoriesChange,
  selectedTimeRange,
  onTimeRangeChange,
  showSignificantOnly,
  onSignificantOnlyChange,
  onClearFilters,
  activeFiltersCount = 0,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();

  const filterContentProps = {
    selectedCategories,
    onCategoriesChange,
    selectedTimeRange,
    onTimeRangeChange,
    showSignificantOnly,
    onSignificantOnlyChange,
    onClearFilters,
  };

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full mb-4 relative">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Suodattimet
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Suodattimet
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent {...filterContentProps} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Collapsible sidebar
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="glass-card rounded-xl p-4">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Suodattimet</h2>
            {activeFiltersCount > 0 && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <div className="animate-fade-in">
            <FilterContent {...filterContentProps} />
          </div>
        )}
      </div>
    </aside>
  );
}
