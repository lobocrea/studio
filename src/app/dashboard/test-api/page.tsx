
import { ApiTestPage } from '@/components/api-test-page';

export default function TestApiRoute() {
  return (
    <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="font-headline text-4xl md:text-6xl font-bold text-foreground">
          Test de Conexión con TheirStack API
        </h1>
        <p className="text-muted-foreground mt-4 text-lg md:text-xl max-w-2xl mx-auto">
          Usa esta herramienta para verificar el estado de la API de búsqueda de empleos.
        </p>
      </header>
      <ApiTestPage />
    </div>
  );
}
