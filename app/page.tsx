// app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#101622] text-slate-50 font-sans">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        {/* Top App Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-[#101622]/90 px-4 backdrop-blur-sm border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/40">
              {/* Iconito calendario simple */}
              <div className="flex flex-col items-center justify-center text-[9px] leading-none text-blue-300">
                <span>LU</span>
                <span className="mt-0.5 h-[1px] w-5 bg-blue-400/80" />
                <span className="mt-1 text-xs font-semibold">12</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[-0.03em]">
                TurnosSaaS
              </span>
              <span className="text-[11px] text-slate-400">
                Agenda online para barberías y estética
              </span>
            </div>
          </div>

          <a
            href="#cta"
            className="flex h-10 items-center justify-center rounded-full bg-blue-500 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/30 hover:bg-blue-400 transition-colors"
          >
            Probar Gratis
          </a>
        </header>

        <main className="flex-grow">
          {/* Hero */}
          <section className="px-4 py-10 sm:py-16">
            <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-col gap-4 text-center lg:text-left">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.045em] text-slate-50 sm:text-5xl">
                  Organizá tu agenda
                  <br className="hidden sm:block" /> y llená más turnos.
                </h1>
                <p className="mx-auto max-w-md text-sm sm:text-base font-normal leading-relaxed text-slate-400 lg:mx-0">
                  Plataforma de turnos online pensada para manicuristas,
                  peluqueros, barberías y centros de estética que viven a
                  WhatsApp pero quieren dejar el cuaderno atrás.
                </p>

                <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
                  <a
                    id="cta"
                    href="#pricing"
                    className="inline-flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-blue-500 px-6 text-sm font-semibold tracking-[0.03em] text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors"
                  >
                    Probar gratis 14 días
                  </a>
                  <p className="text-[11px] text-slate-500">
                    Sin tarjeta. Cancelás cuando quieras.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 sm:justify-start">
                  <div className="inline-flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Sin límite de turnos</span>
                  </div>
                  <div className="inline-flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Ideal para un solo local</span>
                  </div>
                </div>
              </div>

              {/* "Mock" de la app */}
              <div className="flex flex-1 items-center justify-center">
                <div className="mx-auto w-full max-w-xs rounded-3xl border border-slate-800 bg-slate-950/80 p-3 shadow-2xl shadow-black/70">
                  <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-slate-700" />
                  <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-3">
                    {/* Encabezado móvil */}
                    <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold text-slate-100">
                        Hoy · Martes 12
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-400/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Agenda llena
                      </span>
                    </div>

                    {/* Mini calendario */}
                    <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                        <div
                          key={d + i}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span>{d}</span>
                          <span
                            className={[
                              'flex h-6 w-6 items-center justify-center rounded-full text-[11px]',
                              i === 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-900 text-slate-300',
                            ].join(' ')}
                          >
                            {10 + i}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Lista de turnos */}
                    <div className="space-y-2">
                      {[
                        {
                          hora: '10:00',
                          cliente: 'Ana (uñas)',
                          estado: 'Confirmado',
                          color: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
                        },
                        {
                          hora: '12:30',
                          cliente: 'Laura (color)',
                          estado: 'Pendiente',
                          color: 'bg-amber-500/10 text-amber-200 border-amber-400/40',
                        },
                        {
                          hora: '16:00',
                          cliente: 'Diego (corte)',
                          estado: 'Confirmado',
                          color: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40',
                        },
                      ].map((t) => (
                        <div
                          key={t.hora}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-2 py-1.5"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] text-slate-400">
                              {t.hora} hs
                            </span>
                            <span className="text-xs font-medium text-slate-100">
                              {t.cliente}
                            </span>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${t.color}`}
                          >
                            {t.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cómo funciona */}
          <section className="px-4 py-10 sm:py-16 border-t border-slate-800/60">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.03em]">
                  Cómo funciona
                </h2>
                <p className="mx-auto max-w-md text-sm sm:text-base text-slate-400">
                  En pocos minutos tenés tu agenda online lista para compartir
                  en Instagram, WhatsApp y Google.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FeatureCard
                  title="Tus clientes reservan solos"
                  desc="Compartís tu link y ellos eligen día y horario sin escribirte a cada rato."
                  icon="24/7"
                />
                <FeatureCard
                  title="Recordatorios automáticos"
                  desc="Reducí faltazos avisando antes del turno por WhatsApp o SMS."
                  icon="🔔"
                />
                <FeatureCard
                  title="Historial de clientes"
                  desc="Quién vino, qué se hizo, cada cuánto vuelve. Todo ordenado."
                  icon="👥"
                />
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="bg-slate-950/80 border-y border-slate-800 py-10 sm:py-16">
            <div className="mx-auto max-w-4xl px-4">
              <h2 className="pb-6 text-center text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.03em]">
                Lo que dicen quienes ya lo usan
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ReviewCard
                  nombre="Ana Pérez"
                  rol="Manicurista"
                  texto="Ahora mis clientas reservan solas y yo no estoy todo el día atrapada en el WhatsApp. Lleno la agenda mucho más fácil."
                />
                <ReviewCard
                  nombre="Laura Gómez"
                  rol="Peluquera"
                  texto="Los recordatorios hicieron magia. Casi no tengo más turnos colgados sin avisar. Es como tener una recepcionista virtual."
                />
              </div>
            </div>
          </section>

          {/* CTA final */}
          <section className="px-4 py-16 sm:py-20" id="pricing">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.03em]">
                ¿Listo para dejar el cuaderno y el caos de mensajes?
              </h2>
              <p className="mx-auto max-w-md text-sm sm:text-base text-slate-400">
                Arrancá hoy mismo y probá TurnosSaaS en tu barbería o estética.
                Si no te ordena la vida, lo dejás y listo.
              </p>
              <Link
                href="/register"
                className="mt-2 flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-blue-500 px-5 text-sm font-semibold tracking-[0.03em] text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors"
              >
                Comenzar prueba gratuita
              </Link>
              <p className="text-[11px] text-slate-500">
                Sin tarjeta, sin permanencia. Para barberías, peluquerías y
                centros de estética.
              </p>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-800 bg-[#0b1019] px-4 py-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center text-[11px] text-slate-500 sm:flex-row sm:text-left">
            <p>
              © {new Date().getFullYear()} TurnosSaaS. Todos los derechos
              reservados.
            </p>
            <div className="flex gap-4">
              <Link
                href="/terms"
                className="hover:text-blue-400 transition-colors"
              >
                Términos
              </Link>
              <Link
                href="/privacy"
                className="hover:text-blue-400 transition-colors"
              >
                Privacidad
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  desc: string;
  icon: string;
};

function FeatureCard({ title, desc, icon }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold leading-tight text-slate-50">
          {title}
        </h3>
        <p className="text-[11px] sm:text-sm leading-relaxed text-slate-400">
          {desc}
        </p>
      </div>
    </div>
  );
}

type ReviewCardProps = {
  nombre: string;
  rol: string;
  texto: string;
};

function ReviewCard({ nombre, rol, texto }: ReviewCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
          {nombre
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-normal text-slate-50">
            {nombre}
          </p>
          <p className="text-[11px] leading-normal text-slate-400">{rol}</p>
        </div>
      </div>
      <div className="flex gap-0.5 text-yellow-400 text-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-slate-200">{texto}</p>
    </div>
  );
}
