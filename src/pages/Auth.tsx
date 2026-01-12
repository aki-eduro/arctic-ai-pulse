import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const authSchema = z.object({
  email: z.string().email('Virheellinen sähköpostiosoite'),
  password: z.string().min(6, 'Salasanan on oltava vähintään 6 merkkiä'),
  displayName: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'login') {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Kirjautuminen epäonnistui',
              description: 'Virheellinen sähköposti tai salasana.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Virhe',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Tervetuloa!',
            description: 'Kirjautuminen onnistui.',
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(data.email, data.password, data.displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Käyttäjä on jo olemassa',
              description: 'Tämä sähköposti on jo rekisteröity. Kirjaudu sisään.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Virhe',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Tili luotu!',
            description: 'Voit nyt kirjautua sisään.',
          });
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 mb-4">
            <span className="text-primary font-bold text-2xl">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">AI Uutisvahti</h1>
          <p className="text-muted-foreground mt-1">Lapland AI Lab</p>
        </div>

        {/* Auth Form */}
        <div className="glass-card rounded-2xl p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Kirjaudu</TabsTrigger>
              <TabsTrigger value="signup">Rekisteröidy</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)}>
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nimi@esimerkki.fi"
                    {...register('email')}
                    className="bg-secondary/50"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Salasana</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="bg-secondary/50"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Kirjaudu sisään
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nimi (valinnainen)</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Matti Meikäläinen"
                    {...register('displayName')}
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nimi@esimerkki.fi"
                    {...register('email')}
                    className="bg-secondary/50"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Salasana</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="bg-secondary/50"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Luo tili
                </Button>
              </TabsContent>
            </form>
          </Tabs>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">
            ← Takaisin etusivulle
          </a>
        </p>
      </div>
    </div>
  );
}
