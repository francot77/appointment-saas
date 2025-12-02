// app/page.tsx
import Link from 'next/link';
import HeroPreviews from './HeroPreviews';

const PRIMARY = '#6366F1';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* NAVBAR SIMPLE */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-black/40"
              style={{ backgroundColor: PRIMARY, color: '#020617' }}
            >
              T
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide">
                Tu SaaS de Turnos
              </p>
              <p className="text-[10px] text-slate-400">
                Reservas online para negocios de servicios
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-5 text-xs text-slate-300">
            <a href="#features" className="hover:text-slate-100">
              Funciones
            </a>
            <a href="#how" className="hover:text-slate-100">
              Cómo funciona
            </a>
            <a href="#pricing" className="hover:text-slate-100">
              Precios
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs text-slate-300 hover:text-slate-100"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/demo"
              className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full font-medium shadow-md shadow-black/40"
              style={{ backgroundColor: PRIMARY, color: '#020617' }}
            >
              Probar demo
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-4 py-10 grid gap-8 md:grid-cols-[1.1fr,1.1fr] items-center">
        {/* TEXTO */}
        <div className="space-y-5">
          <div className="inline-flex text-center items-center gap-2 text-[11px] px-5 py-1 rounded-full border border-slate-700 bg-slate-900/70 text-slate-300">
            <p className='inline-flex items-center gap-2'>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Turnos online 24/7
            </p>
            <p className='inline-flex items-center gap-2'>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
             Recordatorios por WhatsApp 
            </p>
            <p className='inline-flex items-center gap-2'>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Reprogramación con un link
            </p>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Dejá de agendar turnos a mano.
            <span className="block mt-1 text-slate-300 text-xl md:text-2xl font-normal">
              Una sola plataforma para que tus clientes reserven
              y vos solo confirmes.
            </span>
          </h1>

          <p className="text-sm text-slate-400 max-w-lg">
            Pensado para barberos/peluqueros, manicuristas, cualquier profesional de servicios que necesite 
            una forma simple y rápida de gestionar sus turnos.
            <br />
            Tus clientes podrán reservar online en segundos, y vos ahorrarás tiempo y dolores de cabeza.
            <br />
            Reciben un link para reprogramar si no pueden asistir. vos ves todo en un panel simple y efectivo.
          </p>

          <div className="flex flex-row w-full justify-center sm:flex-row gap-3 pt-1">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium shadow-md shadow-black/40"
              style={{ backgroundColor: PRIMARY, color: '#020617' }}
            >
              Ver demo interactiva
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm border border-slate-700 text-slate-200 hover:bg-slate-900"
            >
              Ver planes
            </a>
          </div>

          <ul className="text-[11px] text-slate-400 space-y-1 pt-2">
            <li>• Turnos online 24/7 sin responder mensajes todo el día.</li>
            <li>• Recordatorios por WhatsApp y reprogramación con un link.</li>
            <li>• Vista por día, semana y calendario para no mezclar horarios.</li>
          </ul>
        </div>

        {/* LADO DERECHO: EN VEZ DE PREVIEW, UNA CARD SIMPLE EXPLICANDO EL DEMO */}
        <div className="relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-[-20px] -left-8 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/60 space-y-3">
            <p className="text-xs font-semibold">
              ¿Qué vas a ver en la demo?
            </p>
            <ol className="text-[11px] text-slate-300 space-y-1.5">
              <li>
                1. Cómo reserva un cliente desde la página pública de turnos.
              </li>
              <li>
                2. Cómo se ve ese turno en el panel del negocio.
              </li>
              <li>
                3. Cómo se confirma, se manda WhatsApp y se reprograma con un link.
              </li>
            </ol>
            <p className="text-[11px] text-slate-400">
              Todo con datos de ejemplo. No necesitás usuario ni contraseña para entender
              cómo funciona el flujo completo.
            </p>
            <div className='flex justify-center w-full'>
              
            <Link
              href="/demo"
              className="inline-flex items-center justify-center w-fit px-4 mt-1 rounded-full py-2 text-[11px] font-medium shadow-md shadow-black/40"
              style={{ backgroundColor: PRIMARY, color: '#020617' }}
              >
              Ver demo ahora
            </Link>
              </div>
          </div>
        </div>
      </section>
    </main>
  );
}
