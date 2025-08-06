'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login: just check if fields are not empty
    if (email && password) {
      // In a real app, you'd perform authentication and store a token.
      // For now, we'll just redirect.
      router.push('/dashboard');
    } else {
      alert('Por favor, introduce tu email y contraseña.');
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
            <CardTitle className="font-headline text-3xl">Bienvenido de Nuevo</CardTitle>
            <CardDescription>Inicia sesión para optimizar tu CV</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
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
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">
                Iniciar Sesión
              </Button>
              <Button variant="link" size="sm" className="text-muted-foreground">
                ¿No tienes una cuenta? Regístrate
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
