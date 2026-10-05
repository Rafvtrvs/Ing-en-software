/** Fuerza grillas internas a columna (uno sobre otro) en formularios móviles */
export function stackFormGrids(root: HTMLElement | null) {
  if (!root) return

  root.querySelectorAll<HTMLElement>('.grid, [class*="grid-cols"]').forEach((el) => {
    el.style.setProperty('display', 'flex', 'important')
    el.style.setProperty('flex-direction', 'column', 'important')
    el.style.setProperty('grid-template-columns', 'none', 'important')
    el.style.setProperty('gap', '1rem', 'important')
    el.style.setProperty('width', '100%', 'important')
  })

  // Cualquier contenedor flex en fila dentro del form → columna
  root.querySelectorAll<HTMLElement>('form, form > div').forEach((el) => {
    const style = window.getComputedStyle(el)
    if (style.display === 'grid' || (style.display === 'flex' && style.flexDirection === 'row')) {
      el.style.setProperty('display', 'flex', 'important')
      el.style.setProperty('flex-direction', 'column', 'important')
      el.style.setProperty('gap', '1rem', 'important')
      el.style.setProperty('width', '100%', 'important')
    }
  })

  root.querySelectorAll<HTMLElement>('input, select, textarea').forEach((el) => {
    el.style.setProperty('width', '100%', 'important')
    el.style.setProperty('max-width', '100%', 'important')
    el.style.setProperty('min-height', '2.75rem', 'important')
    el.style.setProperty('box-sizing', 'border-box', 'important')
    el.style.setProperty('font-size', '1rem', 'important')
  })
}

export function clearStackedFormStyles(root: HTMLElement | null) {
  if (!root) return
  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    ;[
      'display',
      'flex-direction',
      'grid-template-columns',
      'gap',
      'width',
      'max-width',
      'min-height',
      'box-sizing',
      'font-size',
    ].forEach((prop) => el.style.removeProperty(prop))
  })
}
