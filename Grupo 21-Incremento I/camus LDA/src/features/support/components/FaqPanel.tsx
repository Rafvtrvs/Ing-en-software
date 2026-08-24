import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useSupportStore } from '@/store/useSupportStore'
import { cn } from '@/utils/cn'

export function FaqPanel() {
  const faqs = useSupportStore((s) => s.faqs)
  const searchFaq = useSupportStore((s) => s.searchFaq)
  const setSearchFaq = useSupportStore((s) => s.setSearchFaq)
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null)

  const filtered = useMemo(() => {
    const q = searchFaq.toLowerCase().trim()
    if (!q) return faqs
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    )
  }, [faqs, searchFaq])

  const categories = [...new Set(filtered.map((f) => f.category))]

  return (
    <Card>
      <CardHeader
        title="Preguntas Frecuentes"
        subtitle="Guías rápidas para usar el sistema."
      />
      <div className="mb-4 max-w-md">
        <Input
          placeholder="Buscar en la ayuda..."
          value={searchFaq}
          onChange={(e) => setSearchFaq(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No hay resultados para tu búsqueda.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {category}
              </h4>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {filtered
                  .filter((f) => f.category === category)
                  .map((item) => {
                    const isOpen = openId === item.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-50"
                        >
                          {item.question}
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </button>
                        {isOpen && (
                          <p className="border-t border-slate-50 bg-slate-50/50 px-4 py-3 text-sm text-slate-600">
                            {item.answer}
                          </p>
                        )}
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
