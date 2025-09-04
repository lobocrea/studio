'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  
  // Use the browser client
  const supabase = createSupabaseBrowserClient();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // If you want to send a confirmation email
            emailRedirectTo: `${location.origin}/auth/callback`,
          }
        });
        if (error) throw error;
        toast({
          title: "¡Revisa tu correo!",
          description: "Hemos enviado un enlace de confirmación a tu email.",
        });
        // Reset to login view after successful sign-up request
        setIsSignUp(false);
        // Clear fields
        setEmail('');
        setPassword('');
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // The middleware will handle the redirect on navigation, 
        // so we just need to refresh the page to trigger it.
        router.refresh(); 
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: error.error_description || error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-lava-lamp">
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md mx-auto z-10">
        <Card className="glassmorphism-card">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">
              {isSignUp ? 'Crea tu Cuenta' : 'Bienvenido de Nuevo'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'Regístrate para empezar a optimizar tu CV.' : 'Inicia sesión para continuar.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAuthAction}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Procesando...' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isSubmitting}
              >
                {isSignUp ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes una cuenta? Regístrate'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
