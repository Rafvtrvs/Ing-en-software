import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CategoryTagsEditorProps {
  categories: string[]
  onChange: (categories: string[]) => void
}

export function CategoryTagsEditor({ categories, onChange }: CategoryTagsEditorProps) {
  const [input, setInput] = useState('')

  const add = () => {
    const value = input.trim()
    if (!value || categories.includes(value)) return
    onChange([...categories, value])
    setInput('')
  }

  const remove = (cat: string) => {
    onChange(categories.filter((c) => c !== cat))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
          >
            {cat}
            <button
              type="button"
              onClick={() => remove(cat)}
              className="rounded-full p-0.5 hover:bg-primary/20"
              aria-label={`Quitar ${cat}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">Sin categorías configuradas</p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Nueva categoría de falla..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <Button type="button" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={add}>
          Agregar
        </Button>
      </div>
    </div>
  )
}
