import { CvOptimizer } from '@/components/cv-optimizer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            CV Español Optimizer
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Transforma tu CV para el mercado laboral español con la ayuda de la IA.
          </p>
        </header>
        <CvOptimizer />
      </div>
    </main>
  );
}
