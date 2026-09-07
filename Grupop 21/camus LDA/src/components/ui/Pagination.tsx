import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-sm text-slate-500">
        Mostrando {start} a {end} de {totalItems} clientes
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              'min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
