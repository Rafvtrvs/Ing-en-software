interface AuthBrandProps {
  title?: string
  subtitle?: string
}

export function AuthBrand({ title, subtitle }: AuthBrandProps) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <img
        src="/images/logo-camus.png"
        alt="Alcantarillados Camus Ltda."
        className="mx-auto h-auto w-full max-w-[220px] object-contain"
      />
      {title ? (
        <h1 className="mt-2 text-lg font-semibold text-slate-900">{title}</h1>
      ) : (
        <h1 className="sr-only">Alcantarillados Camus Ltda.</h1>
      )}
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}
