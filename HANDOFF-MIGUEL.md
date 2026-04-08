# Handoff: Diego → Miguel (8 Abril 2026)

## TL;DR
Revisamos tu rama `feat/intelligence-layer`, alineamos tu trabajo con nuestra visión de parametrización de seeds, y pusheamos 3 commits encima de los tuyos. Todo queda documentado en `openspec/changes/00-unified-architecture/`.

---

## Qué hicimos

### 1. Unified OpenSpec (`openspec/changes/00-unified-architecture/`)
Creamos un **change completo** (proposal → spec → design → tasks) que unifica tu propuesta de Intelligence Layer con nuestra visión de meta-seeds parametrizadas. Lee los 4 archivos para el contexto completo, pero lo clave:

- **REQ-01**: Supabase Edge Function → Mastra Orchestrator (webhook trigger).
- **REQ-02 "Creative Coders"**: Los agentes NO están limitados a ensamblar JSON. El Forge genera el `delusion.json` para el baseline, pero si el cliente pide algo fuera de `@delusion/blocks`, se delega al Coder del Maintainer que escribe código Astro real. Las seeds son herramientas, no jaulas.
- **REQ-03**: Astro Content Collections + Zod validan el `delusion.json` en build-time.
- **REQ-04**: Versionado NPM de seeds + tracking por tenant.
- **REQ-05**: El Reviewer ahora actúa como **Librarian** — busca en Engram patrones repetidos cross-tenant y propone abstracciones a `@delusion/blocks`.

### 2. `seeds/seed-landing/` (nueva meta-seed)
Clonamos `seeds/restaurant` y la transformamos en la primera meta-seed real:
- `src/content/config.ts` → Zod schema estricto (site, seo, contact, content, i18n_enabled).
- `src/content/business/delusion.json` → Payload de ejemplo. El Forge sobreescribe este archivo por tenant.
- `src/layouts/Layout.astro` → Hidratado 100% desde Content Collections + `astro-seo`.
- `src/pages/index.astro` → Zero hardcoded content. Todo viene del JSON.
- **Build verificado**: `bun run build` pasa limpio. El HTML tiene las metas OG inyectadas.

### 3. Cambios en tu swarm
- **`agents/forge.ts`**: Ya no dice "NEVER generate HTML". Ahora describe `custom_sections` para features fuera de blocks.
- **`schemas/delusion-config.ts`**: Añadimos `seo`, `custom_sections`, `seed.version` (para tracking NPM), e `i18n_enabled`.
- **`agents/reviewer.ts`**: Añadimos `memSearch` y le dimos las instrucciones del Librarian (buscar 3+ tenants con el mismo patrón → proponer abstracción a blocks).

---

## Qué queda pendiente (Phase 4 en `tasks.md`)
- [ ] **2.1**: Supabase Edge Function webhook (`supabase/functions/webhook-mastra/index.ts`).
- [ ] **4.1-4.3**: Validación E2E (mockear webhook, probar routing Orchestrator → Forge/Maintainer).

---

## Para revisar juntos
1. ¿Te cuadra la filosofía de `custom_sections`? Es la clave para que el Forge no sea un assembler determinista sino un "arquitecto" que sabe cuándo delegar al Coder.
2. El `delusionConfigSchema` del swarm y el `businessSchema` del seed-landing tienen estructuras ligeramente distintas (el swarm usa `sections[]` con bloques, el seed usa `content: Record<string, any>`). Habrá que convergirlos cuando definamos el pipeline Forge → seed injection.
3. ¿Borramos `seeds/restaurant` una vez confirmemos que `seed-landing` cubre todo?

---

*Generado durante sesión de arquitectura con Antigravity (Gemini Pro + Claude Opus). Los artefactos detallados están en `openspec/changes/00-unified-architecture/`.*
