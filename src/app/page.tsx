import { CvOptimizer } from '@/components/cv-optimizer';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-lava-lamp">
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
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
