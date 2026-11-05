/** Marca elementos tocados por el apilado móvil para poder limpiarlos sin
 *  destruir otros estilos inline (p. ej. width de barras de progreso). */
const STACK_ATTR = 'data-form-stack'

function markStacked(el: HTMLElement) {
  el.setAttribute(STACK_ATTR, '1')
}

/** Fuerza grillas internas a columna (uno sobre otro) en formularios móviles */
export function stackFormGrids(root: HTMLElement | null) {
  if (!root) return

  root.querySelectorAll<HTMLElement>('.grid, [class*="grid-cols"]').forEach((el) => {
    markStacked(el)
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
      markStacked(el)
      el.style.setProperty('display', 'flex', 'important')
      el.style.setProperty('flex-direction', 'column', 'important')
      el.style.setProperty('gap', '1rem', 'important')
      el.style.setProperty('width', '100%', 'important')
    }
  })

  root.querySelectorAll<HTMLElement>('input, select, textarea').forEach((el) => {
    markStacked(el)
    el.style.setProperty('width', '100%', 'important')
    el.style.setProperty('max-width', '100%', 'important')
    el.style.setProperty('min-height', '2.75rem', 'important')
    el.style.setProperty('box-sizing', 'border-box', 'important')
    el.style.setProperty('font-size', '1rem', 'important')
  })
}

export function clearStackedFormStyles(root: HTMLElement | null) {
  if (!root) return
  root.querySelectorAll<HTMLElement>(`[${STACK_ATTR}]`).forEach((el) => {
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
    el.removeAttribute(STACK_ATTR)
  })
}
