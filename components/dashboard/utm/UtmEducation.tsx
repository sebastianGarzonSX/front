'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const SECTIONS = [
  {
    id: 'what',
    title: 'Qué son los UTMs',
    content: `
Los **UTM** (Urchin Tracking Module) son pequeños fragmentos de texto que agregas al final de una URL para saber **de dónde viene cada visitante**.

Cuando alguien hace clic en un link con UTMs, las plataformas de analytics y CRMs (como GoHighLevel) registran automáticamente esa información. Así puedes responder preguntas como:

- ¿Cuántos leads llegaron por el anuncio de Facebook vs. el de Instagram?
- ¿Qué campaña generó más ventas?
- ¿Qué creatividad (video vs. imagen) convierte mejor?

**Sin UTMs**, todos los leads aparecen como "tráfico directo" y no puedes medir qué está funcionando.
    `.trim(),
  },
  {
    id: 'params',
    title: 'Los 5 parámetros UTM explicados',
    content: 'params_table',
  },
  {
    id: 'example',
    title: 'Ejemplo real para una Clase en Vivo',
    content: `
Supongamos que Diana tiene una clase en vivo el 29 de abril y quiere promocionarla con un anuncio en Facebook e Instagram.

**URL base del embudo:**
\`https://registro.dianacortes.com/clase-vivo\`

**Para el anuncio de Facebook (video testimonial):**
\`\`\`
https://registro.dianacortes.com/clase-vivo?utm_source=facebook&utm_medium=paid&utm_campaign=clase-vivo-29abr&utm_content=video-testimonio
\`\`\`

**Para el anuncio de Instagram (story):**
\`\`\`
https://registro.dianacortes.com/clase-vivo?utm_source=instagram&utm_medium=paid&utm_campaign=clase-vivo-29abr&utm_content=story-urgencia
\`\`\`

Cuando los leads se registren, GHL capturará automáticamente estos parámetros y podrás ver en el dashboard:
- 47 leads llegaron por Facebook (video testimonial)
- 23 leads llegaron por Instagram (story)
- El video testimonial generó 3x más ventas
    `.trim(),
  },
  {
    id: 'ghl',
    title: 'Cómo funciona con GoHighLevel',
    content: `
GHL captura los UTMs automáticamente cuando un lead llega a través de un formulario o landing page de GHL que tiene UTMs en la URL.

**Lo que GHL registra en cada contacto:**
- \`utmAdId\` — El ID del anuncio de Meta (se asigna automáticamente si usas el pixel de Meta en GHL)
- \`utmSessionSource\` — La fuente del tráfico (tu \`utm_source\`)
- \`medium\` — El medio (tu \`utm_medium\`)
- \`adName\` — El nombre del anuncio

**Requisitos para que funcione:**
1. Los links de tus anuncios DEBEN tener UTMs
2. Los formularios/funnels de GHL deben estar en la misma URL que tiene los UTMs
3. Los contactos que entran por formulario de GHL reciben los UTMs automáticamente

**No necesitas "pixeles" adicionales** — el tracking nativo de GHL combinado con UTMs ya captura toda la atribución necesaria.
    `.trim(),
  },
  {
    id: 'ghl-config',
    title: 'Configuración recomendada en GHL para el dashboard',
    content: `
Para que el dashboard muestre datos correctos, GHL debe estar configurado así:

**1. Tags para Clases en Vivo (OBLIGATORIO)**
Cada clase debe tener un tag con formato \`clase DD/mes\` (ejemplo: \`clase 29/abril\`). Este tag se usa para:
- Filtrar leads de cada clase en el dashboard "Clase en Vivo"
- Cruzar con campañas de Meta Ads del mismo periodo
- Generar el embudo de conversión (Leads → Lead Magnet → Sesión → Compra)

**2. Tags de Lead Magnet (RECOMENDADO)**
Para medir qué opción del muestreo/lead magnet eligió cada lead, asigna tags con prefijo \`lm_\`:
- \`lm_dolores\` — Eligió "dolores de negocio"
- \`lm_ventas\` — Eligió "ventas"
- \`lm_claridad\` — Eligió "claridad"
- \`lm_equipos\` — Eligió "equipos"

**3. Tags de Ciudad (para embudo por ciudad)**
Si manejas eventos por ciudad, asigna tags con el nombre de la ciudad:
- \`bogota\`, \`medellin\`, \`cali\`, \`barranquilla\`, etc.

**4. Pipelines y Stages**
El dashboard lee los pipelines directamente de GHL. Los stages se mapean a estas categorías:
- **Frío** — Contacto sin interacción (nombres con: "frío", "sin interacción", "cold")
- **Interactuó** — Respondió mensaje (nombres con: "interactuó", "contactado", "respondió")
- **Muestreo** — Completó el lead magnet (nombres con: "pregunta", "muestreo", "lead magnet")
- **Decisión** — En proceso de evaluación (nombres con: "decisión", "evaluación", "considera")
- **Pago** — Solicitud de pago o link enviado (nombres con: "pago", "solicitud", "link", "precio")
- **Venta** — Cerró la compra (nombres con: "venta", "ganado", "compra", "cerró")

**5. Custom Fields (para reportes de clase)**
Si usas formularios con preguntas personalizadas, los custom fields de GHL se capturan automáticamente y se muestran en el reporte de cada clase.

**6. Triggers que debes tener activos**
- Al recibir formulario → Asignar tag de clase (\`clase DD/mes\`)
- Al responder muestreo → Asignar tag \`lm_*\` correspondiente
- Al completar webinar → Mover a stage "sesión" o asignar tag \`sesion_completada\`
- Al realizar pago → Mover a stage de "venta" / pipeline de venta

**7. Nombre de campañas en Meta Ads**
Para que el cruce Meta-GHL funcione automáticamente, las campañas de clase deben contener \`CLASE SEM\` en el nombre (ejemplo: \`CLASE SEM 29 ABRIL - Video Testimonio\`).
    `.trim(),
  },
  {
    id: 'naming',
    title: 'Convenciones de naming recomendadas',
    content: 'naming_table',
  },
] as const

const PARAM_DETAILS = [
  {
    param: 'utm_source',
    label: 'Fuente',
    description: 'De dónde viene el tráfico. La plataforma o canal.',
    required: true,
    examples: ['facebook', 'instagram', 'google', 'whatsapp', 'email', 'tiktok'],
    analogy: 'Como la dirección de remitente en una carta.',
  },
  {
    param: 'utm_medium',
    label: 'Medio',
    description: 'El tipo de canal o formato.',
    required: true,
    examples: ['paid', 'cpc', 'organic', 'social', 'email', 'story'],
    analogy: 'Como el tipo de transporte: avión (pagado) vs. caminando (orgánico).',
  },
  {
    param: 'utm_campaign',
    label: 'Campaña',
    description: 'El nombre de la campaña específica. Debe ser único y descriptivo.',
    required: true,
    examples: ['clase-vivo-29abr', 'evento-bogota-may', 'lanzamiento-curso-x'],
    analogy: 'El nombre de la misión: "Operación Clase en Vivo Mayo".',
  },
  {
    param: 'utm_content',
    label: 'Contenido',
    description: 'Diferencia variantes del mismo anuncio. Ideal para A/B testing.',
    required: false,
    examples: ['video-testimonio', 'carrusel-beneficios', 'imagen-promo'],
    analogy: 'El sobre de la carta: uno rojo (video) vs. uno azul (imagen).',
  },
  {
    param: 'utm_term',
    label: 'Término',
    description: 'Palabra clave asociada. Principalmente útil para Google Ads.',
    required: false,
    examples: ['marketing-digital', 'emprendimiento', 'curso-online'],
    analogy: 'Las palabras clave que buscó la persona antes de encontrarte.',
  },
]

const NAMING_CONVENTIONS = [
  {
    param: 'utm_source',
    rule: 'Siempre en minúsculas, sin espacios',
    values: ['facebook', 'instagram', 'google', 'whatsapp', 'email', 'tiktok', 'youtube'],
  },
  {
    param: 'utm_medium',
    rule: 'Tipo de canal simplificado',
    values: ['paid', 'cpc', 'organic', 'social', 'email', 'story', 'reel', 'referral'],
  },
  {
    param: 'utm_campaign',
    rule: 'formato: tipo-tema-fecha (guiones, sin espacios)',
    values: ['clase-vivo-29abr', 'evento-bogota-may', 'lanzamiento-curso-x', 'retargeting-mayo'],
  },
  {
    param: 'utm_content',
    rule: 'formato: tipo-descripcion',
    values: ['video-testimonio', 'carrusel-beneficios', 'imagen-promocion', 'story-urgencia'],
  },
]

export function UtmEducation() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['what', 'params']))

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-1">Guía de UTMs para tracking de campañas</h2>
        <p className="text-xs text-[var(--color-ink-3)]">
          Todo lo que necesitas saber para medir de dónde vienen tus leads y qué anuncios generan ventas.
        </p>
      </div>

      {SECTIONS.map(section => {
        const isExpanded = expandedSections.has(section.id)
        return (
          <div
            key={section.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="
                w-full flex items-center justify-between px-5 py-4 text-left
                hover:bg-[var(--color-surface-2)] transition-colors
              "
            >
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">{section.title}</h3>
              {isExpanded ? (
                <ChevronUp size={16} className="text-[var(--color-ink-3)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--color-ink-3)]" />
              )}
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 border-t border-[var(--color-border)]">
                {section.content === 'params_table' ? (
                  <ParamsTable />
                ) : section.content === 'naming_table' ? (
                  <NamingTable />
                ) : (
                  <div className="pt-4 text-xs text-[var(--color-ink-2)] leading-relaxed space-y-3 utm-prose">
                    <FormattedContent text={section.content} />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ParamsTable() {
  return (
    <div className="pt-4 space-y-4">
      {PARAM_DETAILS.map(p => (
        <div
          key={p.param}
          className="p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <code className="text-[11px] font-mono font-bold text-[var(--color-gold)]">{p.param}</code>
            <span className="text-xs font-medium text-[var(--color-ink)]">{p.label}</span>
            <span className={`
              text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded
              ${p.required
                ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                : 'bg-[var(--color-surface-2)] text-[var(--color-ink-3)]'
              }
            `}>
              {p.required ? 'Recomendado' : 'Opcional'}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-2)] mb-2">{p.description}</p>
          <p className="text-[10px] text-[var(--color-ink-3)] italic mb-2">{p.analogy}</p>
          <div className="flex flex-wrap gap-1.5">
            {p.examples.map(ex => (
              <span key={ex} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink-2)]">
                {ex}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function NamingTable() {
  return (
    <div className="pt-4">
      <p className="text-xs text-[var(--color-ink-2)] mb-4">
        Usar nombres consistentes es clave para que los reportes sean limpios. Sigue estas reglas:
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium">Parámetro</th>
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium">Regla</th>
            <th className="py-2 px-3 text-left text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium">Valores sugeridos</th>
          </tr>
        </thead>
        <tbody>
          {NAMING_CONVENTIONS.map(c => (
            <tr key={c.param} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-2.5 px-3">
                <code className="text-[10px] font-mono text-[var(--color-gold)]">{c.param}</code>
              </td>
              <td className="py-2.5 px-3 text-[var(--color-ink-2)]">{c.rule}</td>
              <td className="py-2.5 px-3">
                <div className="flex flex-wrap gap-1">
                  {c.values.map(v => (
                    <span key={v} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--color-canvas)] text-[var(--color-ink-2)]">
                      {v}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FormattedContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeContent: string[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-ink-2)] overflow-x-auto leading-relaxed">
            {codeContent.join('\n')}
          </pre>
        )
        codeContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line)
      continue
    }

    if (!line.trim()) {
      continue
    }

    if (line.startsWith('- ')) {
      elements.push(
        <p key={key++} className="pl-3 border-l-2 border-[var(--color-border)]">
          <InlineFormat text={line.slice(2)} />
        </p>
      )
    } else {
      elements.push(
        <p key={key++}>
          <InlineFormat text={line} />
        </p>
      )
    }
  }

  return <>{elements}</>
}

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-[var(--color-ink)] font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-gold)] font-mono text-[10px]">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
