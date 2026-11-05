import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Product } from '@/types'
import { cn } from '@/utils/cn'

interface ProductActionsMenuProps {
  product: Product
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductActionsMenu({
  product,
  onView,
  onEdit,
  onDelete,
}: ProductActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePosition = () => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const menuWidth = 176
    const left = Math.min(
      rect.right - menuWidth,
      window.innerWidth - menuWidth - 8,
    )
    setPos({
      top: rect.bottom + 4,
      left: Math.max(8, left),
    })
  }

  useEffect(() => {
    if (!open) return
    updatePosition()
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => updatePosition()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  const run = (action: (p: Product) => void) => {
    setOpen(false)
    action(product)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700',
          open && 'bg-slate-100 text-slate-700',
        )}
        aria-label={`Más acciones de ${product.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[80] w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => run(onView)}
            >
              <Eye className="h-4 w-4 text-slate-400" />
              Ver
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => run(onEdit)}
            >
              <Pencil className="h-4 w-4 text-amber-500" />
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => run(onDelete)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
