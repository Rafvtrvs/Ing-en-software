interface CuPageBannerProps {
  rf: string
  rfTitle: string
  cu: string
  cuTitle: string
}

/** Encabezado estándar para capturas del informe (una vista por CU) */
export function CuPageBanner({ rf, rfTitle, cu, cuTitle }: CuPageBannerProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-blue-50 to-white px-4 py-4 shadow-sm sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {rf} · {rfTitle}
      </p>
      <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
        {cu} — {cuTitle}
      </h2>
    </div>
  )
}
