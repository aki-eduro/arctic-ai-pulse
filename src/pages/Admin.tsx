import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, RefreshCw, Power, PowerOff } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Source, ArticleCategory } from '@/types/database';

const sourceSchema = z.object({
  name: z.string().min(1, 'Nimi vaaditaan'),
  rss_url: z.string().url('Virheellinen URL'),
  category: z.enum(['research', 'industry', 'tools', 'regulation', 'education']),
  weight: z.number().min(1).max(10),
});

type SourceFormData = z.infer<typeof sourceSchema>;

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  research: 'Tutkimus',
  industry: 'Teollisuus',
  tools: 'Työkalut',
  regulation: 'Sääntely',
  education: 'Koulutus',
};

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      category: 'industry',
      weight: 5,
    },
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const { data, error } = await supabase
          .from('sources')
          .select('*')
          .order('name');

        if (error) throw error;
        setSources((data as Source[]) || []);
      } catch (error) {
        console.error('Error fetching sources:', error);
        toast({
          title: 'Virhe',
          description: 'Lähteiden lataaminen epäonnistui.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchSources();
    }
  }, [isAdmin, toast]);

  const onSubmit = async (data: SourceFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('sources').insert({
        name: data.name,
        rss_url: data.rss_url,
        category: data.category,
        weight: data.weight,
      });

      if (error) throw error;

      toast({
        title: 'Lähde lisätty',
        description: `${data.name} lisätty onnistuneesti.`,
      });

      reset();
      setIsDialogOpen(false);

      // Refresh sources
      const { data: newSources } = await supabase
        .from('sources')
        .select('*')
        .order('name');
      setSources((newSources as Source[]) || []);
    } catch (error: any) {
      console.error('Error adding source:', error);
      toast({
        title: 'Virhe',
        description: error.message.includes('duplicate')
          ? 'Tämä RSS-URL on jo lisätty.'
          : 'Lähteen lisääminen epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    if (!confirm(`Haluatko varmasti poistaa lähteen "${sourceName}"?`)) return;

    try {
      const { error } = await supabase.from('sources').delete().eq('id', sourceId);

      if (error) throw error;

      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      toast({
        title: 'Lähde poistettu',
        description: `${sourceName} poistettu.`,
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Virhe',
        description: 'Lähteen poistaminen epäonnistui.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (source: Source) => {
    try {
      const { error } = await supabase
        .from('sources')
        .update({ is_active: !source.is_active })
        .eq('id', source.id);

      if (error) throw error;

      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, is_active: !s.is_active } : s
        )
      );
    } catch (error) {
      console.error('Error toggling source:', error);
      toast({
        title: 'Virhe',
        description: 'Lähteen päivittäminen epäonnistui.',
        variant: 'destructive',
      });
    }
  };

  const handleIngestNow = async () => {
    setIsIngesting(true);
    try {
      const { error } = await supabase.functions.invoke('ingest-rss');

      if (error) throw error;

      toast({
        title: 'Ingestointi käynnistetty',
        description: 'RSS-syötteiden haku käynnissä taustalla.',
      });
    } catch (error) {
      console.error('Error triggering ingest:', error);
      toast({
        title: 'Virhe',
        description: 'Ingestoinnin käynnistäminen epäonnistui.',
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Hallinta</h1>
            <p className="text-muted-foreground">
              Hallinnoi RSS-lähteitä ja ingestointia
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleIngestNow}
              disabled={isIngesting}
            >
              {isIngesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Hae uutiset nyt
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Lisää lähde
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lisää uusi RSS-lähde</DialogTitle>
                  <DialogDescription>
                    Lisää uusi RSS-syöte uutisten hakemista varten.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nimi</Label>
                    <Input
                      id="name"
                      placeholder="esim. MIT Technology Review"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rss_url">RSS URL</Label>
                    <Input
                      id="rss_url"
                      placeholder="https://example.com/feed.xml"
                      {...register('rss_url')}
                    />
                    {errors.rss_url && (
                      <p className="text-sm text-destructive">{errors.rss_url.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Kategoria</Label>
                    <Select
                      value={watch('category')}
                      onValueChange={(v) => setValue('category', v as ArticleCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Painoarvo (1-10)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min={1}
                      max={10}
                      {...register('weight', { valueAsNumber: true })}
                    />
                    {errors.weight && (
                      <p className="text-sm text-destructive">{errors.weight.message}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Lisää lähde
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sources Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Ei lähteitä. Lisää ensimmäinen lähde.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nimi</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Painoarvo</TableHead>
                  <TableHead>Tila</TableHead>
                  <TableHead className="text-right">Toiminnot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{source.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {source.rss_url}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[source.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{source.weight}</TableCell>
                    <TableCell>
                      <Badge
                        variant={source.is_active ? 'default' : 'secondary'}
                        className={source.is_active ? 'bg-accent text-accent-foreground' : ''}
                      >
                        {source.is_active ? 'Aktiivinen' : 'Pois päältä'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(source)}
                        >
                          {source.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSource(source.id, source.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
