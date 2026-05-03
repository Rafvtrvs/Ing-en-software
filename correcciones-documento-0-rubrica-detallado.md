# Listado detallado de correcciones — Documento 0  
**Proyecto:** Sistema de Gestión y Control de Servicios — Alcantarillados Camus Ltda.  
**Referencia:** Rúbrica 2026 «Proyecto Ingeniería de Software» v4  
**Nota:** Este listado se elaboró cotejando el contenido extraíble del PDF del Documento 0 con los ítems obligatorios de la rúbrica. Algunas páginas o anexos al final del PDF no fueron revisados línea a línea; conviene validar cada punto en la versión Word actual.

---

## 1. Estructura del documento e índices

### 1.1 Índice de tablas
**Problema:** En la rúbrica se exige **Índice de figuras** e **Índice de tablas**. El índice del documento lista contenidos y figuras; no queda claro un **índice de tablas** formal.

**Corrección:**  
- Si hay tablas (p. ej. matriz RF vs CU, listados tabulados), numerarlas como **Tabla X.Y**, citarlas en el texto y listarlas en el **Índice de tablas**.  
- Si no hay tablas, evaluar con el criterio del curso: incluir al menos la **matriz de trazabilidad** como tabla obligatoria y entonces sí tendrá índice.

### 1.2 Numeración de secciones (huecos y consistencia)
**Problema:** En el índice aparece secuencia **2.1, 2.2, 2.4** (ausencia aparente de **2.3** entre 2.2 y 2.4). Eso genera impresión de documento incompleto o error de numeración.

**Corrección:**  
- Renumerar para que no falte subsección, o **recuperar 2.3** si corresponde (p. ej. misión/visión mal ubicadas en el índice).  
- Alinear **índice ↔ numeración real** en el cuerpo del documento.

### 1.3 Notas internas visibles en el índice
**Problema:** En el índice figura texto tipo **«FODA (primera fortaleza está demás)»**, que parece una **nota de trabajo interno**, no un título de entrega.

**Corrección:**  
- Eliminar esa frase del índice.  
- Corregir el contenido del **FODA** en el cuerpo si hay un ítem duplicado o mal ubicado («primera fortaleza está demás»).

---

## 2. Requisitos según rúbrica (bloque crítico)

La rúbrica solicita explícitamente, para la parte de requisitos:

1. **Requerimientos funcionales en UR (estándar ESA)**  
2. **Casos de uso (extendido)**  
3. **Diagrama de casos de uso**  
4. **Matriz de requerimientos versus casos de uso**

### 2.1 Formato UR / estándar ESA
**Problema:** En el material revisado, los RF aparecen como lista **RF-01 …** en prosa simple. La rúbrica pide formato **UR bajo ESA** (plantilla, campos y redacción acordes al estándar que use el curso).

**Corrección:**  
- Obtener la **plantilla oficial** del profesor o material de la asignatura para User Requirements (ESA).  
- **Migrar** cada RF (o agruparlos lógicamente) al formato exigido sin perder numeración trazable.

### 2.2 Diagrama de casos de uso
**Problema:** No queda evidenciado en las páginas centrales revisadas un **diagrama de casos de uso** (UML: actores, casos de uso, relaciones «include»/«extend» si aplica).

**Corrección:**  
- Elaborar el **diagrama de CU** (Draw.io, Enterprise Architect, StarUML, etc.).  
- Insertarlo en el capítulo de requisitos y **referenciarlo** desde el texto («como muestra la Figura …»).

### 2.3 Matriz Requerimientos ↔ Casos de uso
**Problema:** La rúbrica exige **matriz** RF vs CU. No aparece en el fragmento analizado.

**Corrección:**  
- Construir tabla (Excel o Word) **RF-ID × CU-ID** (relación N:M si aplica).  
- Incorporarla al documento como **Tabla** numerada y en el índice de tablas.

### 2.4 Trazabilidad incompleta entre RF y casos de uso
**Problema:** La sección «Casos de uso por requerimiento» desarrolla en detalle principalmente **RF-01, RF-02, RF-03**. Los requisitos **RF-04 en adelante** (hasta **RF-71**) no tienen el mismo nivel de desglose en el material revisado.

**Riesgo:** La rúbrica penaliza **omisiones y falta de trazabilidad** con descuentos de **1,5 puntos por evento** (según sección 3.1 de la rúbrica).

**Corrección:**  
- Para **cada RF**, definir al menos un CU que lo realice, o justificar fusión en la matriz.  
- Completar **casos de uso extendidos** (pre/postcondiciones, curso normal, alternativas) para los flujos críticos del negocio (órdenes de trabajo, terreno, inventario, pagos, reportes).  
- Priorizar por impacto: autenticación, órdenes de trabajo, evidencias, inventario, pagos, dashboard, notificaciones.

---

## 3. Casos de uso: formato y calidad

### 3.1 Nombres en gerundio
**Problema:** La rúbrica indica que el nombre del caso de uso debe ir en **gerundio** («Ingresando…», «Validando…»). Parte de los nombres cumple; debe auditar **todos** por uniformidad.

**Corrección:** Revisión global de títulos de CU.

### 3.2 Redacción y coherencia interna en CU
**Ejemplo detectado:** En un CU de error de autenticación, el propósito habla de credenciales «correctas o incompletas» cuando el flujo es de **credenciales incorrectas**. Ajustar redacción para evitar contradicciones.

**Corrección:** Pasada de **revisión lingüística** y de **lógica de negocio** en curso normal y alternativos.

---

## 4. Errores de maquetación en el cuerpo del documento

### 4.1 Texto fuera de lugar en la Introducción
**Problema:** En el apartado de introducción aparece incrustado contenido de **caso de uso** («Caso de Uso N°3», actores, precondiciones, tabla actor/sistema, etc.), como si hubiera un **error de copiar/pegar** en Word.

**Corrección:**  
- Eliminar ese bloque de la introducción.  
- Ubicarlo solo en el **capítulo de casos de uso** correspondiente.

---

## 5. Requerimientos no funcionales (RNF)

### 5.1 Duplicidad RNF-02 y RNF-10
**Problema:** Ambos establecen el registro completo de información de cliente en **máximo 3 minutos** en condiciones normales.

**Corrección:**  
- Fusionar en un solo RNF y renumerar los siguientes, **o**  
- Reformular uno como requisito **distinto y medible** (p. ej. tiempo de **sincronización offline**, latencia de dashboard, etc.).

### 5.2 Lista de RNF y cobertura
**Corrección recomendada:** Verificar que cada RNF sea **verificable** (métrica o prueba) y no entre en conflicto con decisiones de arquitectura (ver sección 8).

---

## 6. Requerimientos funcionales (RF): duplicados y limpieza

### 6.1 Repeticiones detectadas (consolidar)
En el listado aparecen **varios pares o tríos** que describen la misma necesidad con redacción distinta. Ejemplos de líneas a unificar (no exhaustivo del PDF completo):

- Personalización de interfaz / colores **navbar, footer, fondo** y **restablecer por defecto** (aparece más de una vez: p. ej. RF-42–44 y RF-62–64 y similares).  
- **Formularios digitales en terreno** / técnicos registrando órdenes (p. ej. RF-49 y RF-65).  
- **Asignación de personal** a órdenes (p. ej. RF-55 y RF-66).  
- **Cambio manual de estado** de órdenes (p. ej. RF-54 y RF-67).  
- **Reporte «Intervención de Terceros»** (p. ej. RF-53 y RF-68).  
- **Fechas inicio/término** (p. ej. RF-51 y RF-70).  
- **Navegación por menú principal** (p. ej. RF-45 y RF-71).  
- **Filtrar en gráficos** (p. ej. RF-61 vs RF-29/30 según alcance).

**Corrección:**  
- **Consolidar** en un único RF por capacidad.  
- **Renumerar** la lista completa para que la trazabilidad RF→CU→implementación sea lineal.  
- Evitar inflar artificialmente el conteo de RF con duplicados (evaluación y credibilidad).

### 6.2 Cantidad mínima de RF según tamaño del grupo
**Regla de la rúbrica:** al menos **50 RF** para grupo base de **6** personas; **+10 RF por cada integrante adicional** a ese grupo de 6.

**Cálculo orientativo:**  
- **8 integrantes:** mínimo **70 RF** (50 + 20).  
- **9 integrantes:** mínimo **80 RF** (50 + 30).

**Estado revisado:** el documento llega hasta **RF-71**. Si el equipo es de **9**, puede **faltar** cantidad **después de eliminar duplicados**; hay que **sumar RF reales** nuevos o confirmar número exacto de integrantes.

**Corrección:** Después de deduplicar, **recalcular** y completar hasta el mínimo.

---

## 7. Coherencia entre diagnóstico y solución

### 7.1 Conclusión Ishikawa vs lista de RF
**Problema:** La conclusión menciona módulos como **gestión de inventarios**, **agendamiento inteligente** y **monitoreo de SLA**. No todos aparecen de forma explícita o homogénea como RF dedicados.

**Corrección:**  
- O bien **ajustar la conclusión** al alcance real del proyecto,  
- O **añadir RF** que cubran agendamiento, SLA y monitoreo de forma clara y verificable.

---

## 8. Consideración técnica de la rúbrica (base de datos)

**Texto de la rúbrica (Consideraciones):** en la parte **transaccional**, los datos deben almacenarse en una **base de datos relacional**, no en una **semiestructurada**.

**Implicancia:** Si la solución usa **Firebase / Firestore** (NoSQL documental), puede haber **choque** con el criterio del curso.

**Corrección posible:**  
- Definir qué parte del sistema es **transaccional** y justificar **BD relacional** (p. ej. PostgreSQL, MySQL) para esa parte, **o**  
- Solicitar **criterio explícito** al profesor y documentar la decisión en **Dimensión técnica** / anexo.

---

## 9. Anexos obligatorios (rúbrica sección «Documento 0»)

La rúbrica lista anexos complementarios, entre otros:

- **Currículum Vitae** de cada integrante (**mismo formato** para todos).  
- **Correo de aceptación de requisitos** por parte del usuario/cliente.  
- **Planificación**.  
- **Estimación de costos y beneficios**.  
- **Dimensión técnica del proyecto**.  
- Otros antecedentes pertinentes.

**Corrección:** Comprobar que el Word **autocontenido** incluya estos anexos o referencias completas (sin depender solo de enlaces externos rotos).

---

## 10. Formalismo editorial (APA y formato)

Según anexo de la rúbrica:

- **Márgenes** 2,5 cm; **interlineado** 1,5; fuente **Arial o Times New Roman 12**; texto **justificado**.  
- **Figuras y tablas:** numeración **Capítulo.Correlativo**; **invocar y explicar** cada figura/tablas desde el texto previo.  
- **Referencias bibliográficas** al final en **APA vigente**.  
- **Inicio de cada capítulo en página nueva**; numeración romana/arábiga según normas del curso.

**Corrección:** Auditoría de formato en Word (plantilla del curso si existe).

---

## 11. Paquete de entrega (no solo el PDF)

La rúbrica exige para el Documento 0 (entre otros):

- Documento en **Word**.  
- **BPMN en Bizagi**.  
- **Presentación PPT** (con **traza del documento 0**).  
- **Excel** con análisis cuantitativo, **estimación costo-beneficio**, **planificación**, etc.  
- **Correo de aceptación**.  
- Archivo Excel de **organización del trabajo** (`Grupo N - Organización Trabajo.xlsx`) con capítulo, contenido, autoría y revisión.

**Corrección:** Checklist de carpeta compartida / Drive según indicaciones del profesor (asunto de correo, «Grupo N», etc.).

---

## 12. Presentación oral (Documento 0)

**Rúbrica (3.2.A):**  
- Duración **máximo 15 minutos**.  
- Incluir **traza del documento 0** en la PPT.  
- Portada de la PPT **igual criterio** que el informe (integrantes).  
- Descuento **1,5** puntos por error, omisión, tiempo o falta de trazabilidad en presentación.

**Corrección:** Preparar diapositivas de **trazabilidad** alineadas al índice final del Word.

---

## 13. Control final sugerido (checklist)

| Ítem | Estado objetivo |
|------|-----------------|
| Índice de tablas | Completo o tablas añadidas |
| Sin huecos de numeración | Sí |
| Sin notas internas en índice | Sí |
| RF formato ESA/UR | Según plantilla |
| Diagrama de casos de uso | Incluido y citado |
| Matriz RF ↔ CU | Incluida |
| Trazabilidad RF-01… último RF | Completa |
| Intro sin texto de CU pegado | Limpia |
| RNF sin duplicados lógicos | Revisado |
| RF sin duplicados sustantivos | Consolidado y renumerado |
| Mínimo RF según nº integrantes | Cumplido tras deduplicación |
| Anexos rúbrica | Presentes |
| Criterio BD relacional vs NoSQL | Documentado |
| APA y formato | Aplicado |
| Paquete Word+PPT+Excel+Bizagi | Completo |

---

*Documento generado como referencia interna del equipo. Ajustar redacción final al estilo del curso y validar con el docente ante dudas normativas.*
