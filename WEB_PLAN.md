# Plan de mejoras de la web (Astro)

Plan de trabajo para `packages/web` tras la migración de Next.js a Astro 7 (rama `feat/web-astro-migration`).
Cada punto tiene un ID para pedirlo por separado ("haz A3", "haz C1 y C2").

**Estados:** `[ ]` pendiente · `[~]` hecho sin commit · `[x]` hecho (con commit)

**Prioridad acordada:** que el código sea sencillo de mantener pesa más que la fidelidad al píxel con la versión de Next.js.

**Guías de referencia:** skill `modern-web-guidance` (`.claude/skills/modern-web-guidance`). Antes de implementar un punto de HTML, CSS o JS de cliente: `npx -y modern-web-guidance@latest retrieve "<id>"`. Los IDs aplicables van indicados en cada punto como _(guía: `id`)_.

**Política de navegadores (pendiente de decidir):** las guías dan por seguras las funciones _Baseline widely available_ y piden fallback para el resto. Propuesta: mejora progresiva, es decir, usar funciones nuevas solo si sin ellas la web sigue funcionando (transiciones, speculation rules, `closedby`), sin polyfills. Si se acepta, conviene anotarlo en `CLAUDE.md`.

## Cómo verificar cada cambio

- Comprobaciones ligeras: `npx vitest run --project web`, `npx astro check` (en `packages/web`), `npx oxlint packages/web/src`.
- Para cambios de contenido: comparar `astro dev` contra el último `packages/web/dist` (head, JSON-LD, texto, enlaces y PNG de OG).
- Build completo solo si hace falta: `npm run build` (raíz) y luego `npm run build -w @getmcp/web`. Tarda unos 32 min y genera unos 79.500 archivos en `packages/web/dist`. `--outDir` en otro disco falla (`EXDEV`).
- Regresión visual contra producción: producción solo se reconstruye una vez al día, así que las capturas del mismo día siguen siendo válidas. Hay que usar la misma rama de datos (`chore(registry): daily sync`) que `origin/main`.

## Ya hecho

- [x] **Fuente del logo ASCII y fallback** (`fa17ffc`): subset `symbols2` de Fira Mono con `unicode-range` y `Fira Mono Fallback` con métricas. Lo sustituirá A3.
- [x] **C6** (`430a357`): el botón "Browse servers" del 404 apunta a `/servers` (`src/components/NotFound.tsx`).
- [x] **D4** (`f3b6385`): `APP_COUNT` en `src/lib/constants.ts` sustituye los "19 AI apps" y "N more" escritos a mano. Salida verificada como idéntica.

---

## A. Funciones nativas de Astro

- [ ] **A1. Quitar React de las fichas de servidor.**
  - Pasar `ConfigViewer` y `PackageManagerCommand` a `.astro`, con los paneles pre-renderizados y `hidden`.
  - **Selector:** usar un grupo de `<input type="radio">` nativo con aspecto de pastilla, en lugar de los `role="tab"` actuales.
    - Da gratis el teclado (flechas) y la semántica. Hoy los `role="tab"` no responden a las flechas, y las guías piden que si usas `role="tab"` se comporte como una pestaña completa.
    - El script queda en unas 10 líneas: al cambiar, mostrar el panel y guardar en `localStorage` (claves actuales: `getmcp-preferred-app` y la de `PackageManagerCommand`).
    - Opcional: paneles con `hidden="until-found"` para que la búsqueda del navegador (Ctrl+F) encuentre rutas y configs de otras apps. Necesita sincronizar en `beforematch`, y Safari no lo soporta. _(guía: `search-hidden-content`)_
  - Hoy cada una de las ~39.700 fichas carga `client.*.js` (213 KB, react-dom) y `ConfigViewer.*.js` (43 KB). Este arrastra todos los textos de `GUIDES` porque importa `APP_LABELS` desde `lib/guide-data.ts`.
  - Arregla de paso el parpadeo al hidratar: se pinta la primera pestaña o "npm" y luego salta a la preferencia guardada.
  - Archivos: `src/pages/servers/[id].astro:211,268`, `src/pages/guides/[app].astro:144`.
- [ ] **A2. Quitar React donde sobra en el resto.**
  - `AsciiArt`: revelado con una animación CSS (`clip-path` con `steps()`) dentro de `@media (prefers-reduced-motion: no-preference)`. Así el logo se ve completo sin JS y sin animación para quien la desactiva. Hoy sin JS el logo macizo no aparece nunca.
  - `CliShowcase`: mismo patrón de radios que A1.
  - `AnimatedCommand` y `NotFound`: `.astro` más un script pequeño.
  - Componentes React que solo se renderizan en el servidor (ServerCard, ServerSidebar, CategoryGrid, PopularServers, SupportedApps, StatsBar, FormatShowcase, TeamFeatures, SecurityFeatures, DeveloperExperience, DocsContent, DocsSidebar, CodeBlock): pasarlos a `.astro`. Ojo, `ServerCard` también lo usa la isla `SearchBar`.
  - Ganancia: la home y el 404 sin react-dom, y menos `renderToString` en el build.
- [ ] **A3. API de fuentes de Astro.**
  - **Decisión:** `fontProviders.fontsource()`, no `npm`, para tener la config más simple y quitar la dependencia.
  - Config: Fira Mono en pesos `[400, 500]`, subsets `["latin", "symbols2"]` y `fallbacks: ["monospace"]`.
  - Uso: un único `<Font cssVariable="--font-fira-mono" preload={fontPreload} />` en `BaseLayout.astro`, y `--font-mono: var(--font-fira-mono)` en `@theme inline`.
  - **Preload según la página:** las guías piden precargar solo lo crítico de cada página, no todas las fuentes. _(guía: `performance`, sección Web Fonts)_
    - Todas las páginas precargan `latin` 400.
    - `BaseLayout` acepta la prop `preloadSymbols` (por defecto `false`). `index.astro` y `404.astro` la activan y añaden `symbols2` 400 al preload, porque su logo ASCII está encima del pliegue y seguramente es el LCP. Sin preload, el navegador descubre `symbols2` tarde, tras el CSS y la maquetación, y el logo cambiaría de fuente al cargar.
    - Las demás páginas no descargan `symbols2`: el `unicode-range` evita que se pida si no hay esos caracteres.
  - Se quita:
    - la dependencia `@fontsource/fira-mono`
    - sus imports en `src/layouts/BaseLayout.astro:2-3`
    - las dos `@font-face` escritas a mano en `src/styles/globals.css`
  - Se acepta:
    - El hinting de Fontsource da diferencias de 1 px respecto a producción.
    - El fallback automático usa Courier New, que no existe en Linux ni Android.
  - Comprobar al implementarlo: que el subset `symbols2` se resuelve. Si el proveedor falla, `npm` es el cambio de una línea.
- [ ] **A4. Build incremental** (`experimental.incrementalBuild`, Astro 7.2 o posterior).
  - Devolver `cacheKey` en `getStaticPaths()` de `servers/[id]` y de sus endpoints de OG.
  - Necesita persistir `node_modules/.astro` en CI (~3 GB, `actions/cache`); `astro build --force` reconstruye todo.
  - Es experimental y no está probado con endpoints. Es la mayor mejora posible del build diario (~32 min).
- [ ] **A5. Precarga de la siguiente página y view transitions nativas.**
  - **Precarga:** speculation rules nativas en `BaseLayout.astro`, en lugar del `prefetch` de Astro. _(guía: `improve-next-page-load-performance`)_
    - Una regla de documento (no una lista de URLs) con `prefetch` y `eagerness: "moderate"`, que se activa al pasar el ratón.
    - Excluir `*.png`, `*.xml` y `*.json`.
    - Opcional: `prerender` con `"conservative"`.
    - Solo Chromium; el resto de navegadores la ignora sin romper nada. Con A7 (CSP) hay que comprobar el hash del `<script type="speculationrules">`.
  - **Transiciones:** `@view-transition { navigation: auto; }` solo dentro de `@media (prefers-reduced-motion: no-preference)`. _(guías: `cross-document-transitions`, `consistent-cross-document-transitions`)_
    - Añadir `<link rel="expect" href="#…" blocking="render">` apuntando a un elemento **pequeño** encima del pliegue, como la cabecera, para no animar hacia una página en blanco.
    - **No** apuntar a `#main-content`: en `/servers` (19,8 MB) bloquearía el render hasta parsear todo.
    - Firefox no soporta las transiciones entre documentos: navega sin animación.
  - **No** usar `<ClientRouter />`: es incompatible con `security.csp` y obliga a re-enlazar scripts.
- [ ] **A6. `astro:env`** para `PUBLIC_CF_ANALYTICS_TOKEN`.
  - `envField.string({ context: "client", access: "public", optional: true })`, y borrar la declaración a mano de `src/env.d.ts`.
  - Ojo: `.github/workflows/web.yml` nunca define el token, así que la analítica no se activa. Hay que decidir dónde se configura.
- [ ] **A7. CSP integrada** (`security.csp`). Mejor después de A1 y A2.
  - Hashes automáticos de scripts y estilos en línea; el beacon de Cloudflare va en `scriptDirective.resources`.
  - En páginas estáticas sale como `<meta>`. Para `frame-ancestors` y `report-to` hace falta un `_headers` en el host.
  - Se elimina `src/lib/security-headers.ts`, que hoy no importa nadie.
- [ ] **A8. Logo SVG como componente, prioridad de imágenes y medición del build como integración.**
  - `BaseLayout.astro:84-91`: importar `icon.svg` como componente y quitar `fetchpriority="high"`. Las guías lo reservan para la imagen LCP (como mucho una o dos por página), y en un icono de 24 px compite con ella. _(guía: `optimize-image-priority`)_
  - `servers/[id].astro:143-151`: quitar `loading="lazy"` del icono del servidor. Está en la cabecera, por encima del pliegue, y las guías piden no usar lazy ahí.
  - `scripts/build.ts` y `scripts/measure.ts`: pasar a una integración `astro:build:done`, para que `build` vuelva a ser solo `astro build`.

**Descartado (con motivo):**

- `@astrojs/sitemap`: cambia las URLs (`sitemap-index.xml`) y no sabe la fecha de cada servidor. Mantener los endpoints (ver E5).
- Content collections para el registry: duplican ~45 MB en el data store sin ganar velocidad.
- Server islands o renderizado bajo demanda: necesitan el adapter de Cloudflare, y `@resvg/resvg-js` nativo no funciona en `workerd`.

## B. Rendimiento de páginas grandes

- [ ] **B1. `/servers` pesa 19,8 MB.**
  - El 99,5 % son los props de `<SearchBar client:load servers={…}>`: los ~39.700 servidores serializados en el atributo `props` (`src/pages/servers/index.astro:39-54,113`).
  - Propuesta: un endpoint estático compacto (`src/pages/servers.json.ts`) cargado desde la isla con `client:idle`, y la primera página de resultados en HTML estático para que los crawlers vean más de 24 enlaces. Alternativa: Pagefind.
- [ ] **B2. `/category/ai` pesa 3 MB.**
  - 2.779 tarjetas sin paginar más ~300 KB de JSON-LD `ItemList` (`src/pages/category/[slug].astro:70-81,122-128`).
  - Propuesta: `paginate()` en `/category/[slug]/[...page].astro`, con el `ItemList` limitado a la página actual.
  - Si se descarta paginar, como mínimo añadir `content-visibility: auto` con `contain-intrinsic-size` a la cuadrícula de tarjetas por debajo del pliegue. No reduce los 3 MB, pero sí el coste de render. _(guía: `defer-rendering-heavy-content`)_
- [ ] **B3. Imágenes OG: unos 2,6 GB (66 KB × 39.700) y la mayor parte del tiempo de build.**
  - Opciones: PNG con paleta cuantizada, OG genérica con personalizadas solo para el top N, u otra estrategia. **Requiere decisión.**
  - Borrar de paso `assets/Inter-SemiBold.ttf`, que no se usa (ver D2).

## C. Fallos (ya existían en Next.js)

- [ ] **C1. Las 19 guías muestran "Popular Servers" vacío y sin "Example configuration".**
  - Los slugs de `src/lib/guide-data.ts` (`github`, `filesystem`, `brave-search`…) ya no existen; los reales son tipo `brave-brave-search`.
  - `src/pages/guides/[app].astro:52-68` falla en silencio. Además `sampleServerId = guide.popularServers[0]` puede no coincidir con el servidor elegido.
  - Propuesta: elegirlos desde el registry o las métricas, o validar los slugs en el build.
- [ ] **C2. El JSON-LD no se escapa.**
  - `src/components/JsonLd.astro:9` usa `set:html={JSON.stringify(data)}` con descripciones de terceros. Un `</script>` en el registry rompería la página.
  - Arreglo: `.replace(/</g, "\\u003c")`. Mismo patrón en `DocsContent.tsx:12-57`.
- [ ] **C3. Doble punto en la meta description de cada servidor** (`src/pages/servers/[id].astro:29`): "Sign in once.. Install with:".
- [ ] **C4. La home no tiene `h1` accesible:** `class="absolute hidden"` (`src/pages/index.astro:137`). Cambiar a `sr-only`.
- [ ] **C5. El orden "alfabético" de `/servers`** ordena por ID inverso (`SearchBar.tsx:140-145`); debería ordenar por nombre.
- [x] **C6. El botón "Browse servers" del 404 apuntaba a `/`.** Hecho en `430a357`.
- [ ] **C7. Cabecera móvil:** a 390 px la pastilla "beta" tapa "Servers" (`BaseLayout.astro:81-115`).
  - El flex no tiene `flex-wrap`, y las guías piden `flex-wrap: wrap` siempre que pueda desbordar. _(guía: `css-layout`)_
  - Propuesta: `flex-wrap` con `gap`, y ocultar la pastilla por debajo de `sm`. Alternativa: GitHub como icono.
- [ ] **C8. Riesgos latentes.**
  - **Categorías:** la página filtra las que no tienen nombre (`category/[slug].astro:14-17`), pero el endpoint de OG y `lib/sitemap.ts:22` usan todas. Una categoría nueva produciría una URL que da 404 en el sitemap.
  - **Rutas:** `servers/foo.html` convive con la carpeta `servers/foo/` de la imagen OG (igual en guides y category). Hay que verificar en Cloudflare que `/servers/foo` no redirige a `/servers/foo/`. Si lo hace, mover las OG a `/og/...`.
  - **Guías:** `GUIDE_NAMES` en `og-pages.tsx:89-109` duplica `GUIDES[*].name`, y el endpoint de OG usa sus claves en vez de `GUIDE_SLUGS`.

## D. Limpieza

- [ ] **D1. Restos de Next.js:** borrar `packages/web/.next/`, `next-env.d.ts` y `tsconfig.tsbuildinfo` (761 KB). Quitar del `.gitignore` las entradas que se añadieron para ignorarlos. Revisar el `include: ["**/*"]` de `tsconfig.json`.
- [ ] **D2. Código y assets muertos:** `src/lib/security-headers.ts` (o se resuelve en A7), `@keyframes fade-in-up` (`globals.css`), `assets/Inter-SemiBold.ttf`. También `public/logo.svg` y `logo-light.svg`, que solo usa el README.
- [ ] **D3. Comentarios de Next.js y Vercel:** `SearchBar.tsx:63` y `ConfigViewer.tsx:30` ("server component" y `eslint-disable`), `BaseLayout.astro:17`, `og-image.tsx:82`.
- [x] **D4. Cifras escritas a mano.** Hecho en `f3b6385`. Queda opcional: "10 commands" (`StatsBar.tsx`, `CliShowcase.tsx`) podría salir de `COMMANDS.length`.

## E. Accesibilidad y SEO

- [ ] **E1. Encabezados:** el 404 no tiene `h1`; "Configuration" en `ConfigViewer.tsx:47` es `h3` entre `h2`; las categorías saltan de `h1` a las tarjetas `h3`.
- [ ] **E2. ARIA y teclado:**
  - Las pestañas de `ConfigViewer` no se manejan con las flechas, y el tabpanel apunta a pestañas ocultas en móvil (se resuelve con los radios de A1).
  - `PackageManagerCommand` no comunica qué opción está elegida (se resuelve con los radios de A1).
  - El "Copied" de los botones de copiar no se anuncia: añadir una región `aria-live="polite"`. _(guía: `accessibility`, sección Live Regions)_
  - `FilterSheet` sigue siendo enfocable cuando está cerrado. Propuesta: `<dialog>` nativo abierto con `showModal()`, con `closedby="any"` para cerrar al tocar fuera. _(guías: `accessibility` sección 12, `light-dismiss-a-dialog`)_
    - `showModal()` vuelve inerte el resto de la página, así que el focus trap hecho a mano (`FilterSheet.tsx:22-53`) se elimina.
    - Safari no soporta `closedby`: las guías dan un fallback de unas 10 líneas que cierra con un clic en el `::backdrop`.
  - El `aria-label` de `AsciiArt.tsx:81` está en un `<pre>` sin rol.
  - El `<img>` del logo de la cabecera debería llevar `alt=""`.
- [ ] **E3. Breadcrumbs consistentes:** categoría y guías usan `<span>`, sin `<ol>` ni `aria-current`.
- [ ] **E4. "Actualizado hace X" congelado en el build:** `ServerSidebar.tsx:232-234` usa `relativeTime(lastPush)` en el HTML estático.
  - Propuesta: `<time datetime="…">` con la fecha absoluta en el HTML, y un script mínimo que la reescribe como relativa con `Intl.RelativeTimeFormat`, que es Baseline amplio.
  - Sin JS se ve la fecha absoluta, que nunca queda desfasada.
- [ ] **E5. Sitemap con `lastmod` real:** `lib/sitemap.ts:77` pone la fecha del build a todas las URLs, así que Google ve unos 40.000 cambios al día. Usar la fecha real (por ejemplo `lastPush` de las métricas).
- [ ] **E6. Head:**
  - Falta `og:url`.
  - El 404 hereda el `hreflang` de la home (`metadata.ts:84-89`).
  - Faltan `favicon.ico`, `apple-touch-icon` y el manifest.
  - Sobran los `twitter:image:*` no estándar y la meta `keywords`.
- [ ] **E7. Copiar código:** `scripts/code-copy.ts:40` usa `closest(".rounded-lg")`, que es frágil (mejor un atributo `data-`), y se incluye en las ~39.700 fichas aunque no tengan `CodeBlock`. A los botones de `CodeBlock.tsx:24` les falta `type="button"`.
- [ ] **E8. `?page=` fuera de rango en `/servers`:** se corrige en pantalla, pero la URL conserva el valor erróneo.

## Orden sugerido

1. C y D (fallos y limpieza), más E de bajo esfuerzo.
2. A3, A5, A6 y A8 (mejoras rápidas de Astro).
3. A1, A2, B1 y B2 (fuera React y páginas más ligeras).
4. A4, A7 y B3 (necesitan decisiones de CI y de hosting).
