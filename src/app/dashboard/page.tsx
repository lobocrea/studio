import { CvOptimizer } from '@/components/cv-optimizer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { List } from 'lucide-react';

export default function DashboardPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-lava-lamp">
      <div className="absolute top-4 right-4 z-20">
        <Button asChild variant="ghost">
          <Link href="/dashboard/jobs">
            <List className="mr-2 h-4 w-4" />
            Listado de Empleos
          </Link>
        </Button>
      </div>
      <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground animate-[fadeIn_1s_ease-out]">
            Españoliza tu Curriculum Vitae
          </h1>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl max-w-2xl mx-auto animate-[fadeIn_1.5s_ease-out_forwards] opacity-0">
            Transforma tu CV para el mercado laboral español con nuestro novedoso sistema
          </p>
          <Badge variant="secondary" className="mt-4 animate-[fadeIn_2s_ease-out_forwards] opacity-0">
            ¡No importa el idioma en el que esté!
          </Badge>
        </header>
        <CvOptimizer />
      </div>
    </main>
  );
}
