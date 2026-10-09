# Plan de mejoras de la web (Astro)

Plan de trabajo para `packages/web` tras la migración de Next.js a Astro 7 (rama `feat/web-astro-migration`).
Cada punto tiene un ID para pedirlo por separado ("haz A3", "haz C1 y C2").

**Estados:** `[ ]` pendiente · `[~]` hecho sin commit · `[x]` hecho (con commit)

**Prioridad acordada:** que el código sea sencillo de mantener pesa más que la fidelidad al píxel con la versión de Next.js.

**Guías de referencia:** skill `modern-web-guidance` (`.claude/skills/modern-web-guidance`). Antes de implementar un punto de HTML, CSS o JS de cliente: `npx -y modern-web-guidance@latest retrieve "<id>"`. Los IDs aplicables van indicados en cada punto como _(guía: `id`)_.

**Política de navegadores (decidida):** mejora progresiva. Se usan funciones nuevas solo si sin ellas la web sigue funcionando (transiciones, speculation rules, `closedby` con su pequeño fallback). Sin polyfills. Está anotada en `AGENTS.md`.

## Cómo verificar cada cambio

- Comprobaciones ligeras: `npx vitest run --project web`, `npx astro check` (en `packages/web`), `npx oxlint packages/web/src`.
- Para cambios de contenido: comparar `astro dev` contra el último `packages/web/dist` (head, JSON-LD, texto, enlaces y PNG de OG).
- Build parcial (para revisar HTML construido: CSP, OG, tiempos): desde `packages/web`, `WEB_MAX_SERVER_PAGES=200 npx astro build --outDir node_modules/.partial-dist` (unos 45 s, 238 páginas, ~500 archivos) y borrar la carpeta después. Siempre incluye `github-github`, `data-prism`, `pg-aiguide`, `apify-apify`, `sh-mcp`, `pretrip`, `bev-door` y `0bridge`. El `outDir` debe estar en el mismo disco que el repo.
- Build completo solo si hace falta: `npm run build` (raíz) y luego `npm run build -w @getmcp/web`. Tarda unos 32 min y genera unos 79.500 archivos en `packages/web/dist`. `--outDir` en otro disco falla (`EXDEV`).
- Regresión visual contra producción: producción solo se reconstruye una vez al día, así que las capturas del mismo día siguen siendo válidas. Hay que usar la misma rama de datos (`chore(registry): daily sync`) que `origin/main`.

## Ya hecho

- [x] **Fuente del logo ASCII y fallback** (`fa17ffc`): subset `symbols2` de Fira Mono con `unicode-range` y `Fira Mono Fallback` con métricas. Sustituido por A3.
- [x] **C6** (`430a357`): el botón "Browse servers" del 404 apunta a `/servers` (`src/components/NotFound.tsx`).
- [x] **P0. Builds parciales**: `WEB_MAX_SERVER_PAGES` en `src/lib/server-paths.ts` limita las fichas `/servers/[id]` y sus OG (sin definir = todas). Probado con 200: 43 s y 503 archivos.
- [x] **D4** (`f3b6385`): `APP_COUNT` en `src/lib/constants.ts` sustituye los "19 AI apps" y "N more" escritos a mano. Salida verificada como idéntica.

---

## A. Funciones nativas de Astro

- [x] **A1. Quitar React de las fichas de servidor.** Hecho: `ConfigViewer.astro` y `PackageManagerCommand.astro` con radios nativos en `<fieldset>` (`name="config-app"` / `"package-manager"`, `autocomplete="off"`), `scripts/radio-panels.ts` y `RestoreChoice.astro` (script inline constante en `lib/restore-choice.ts`; A7 debe añadir su hash). Fichas y guías sin `astro-island` ni `client.*.js`; texto visible y `<pre>` idénticos al antes. Parpadeo verificado: con los módulos bloqueados, la restauración inline ya muestra la opción guardada. Sin `hidden="until-found"`. El título "Configuration" pasa a `h2`.
  - Pasar `ConfigViewer` y `PackageManagerCommand` a `.astro`, con los paneles pre-renderizados y `hidden`.
  - **Selector:** usar un grupo de `<input type="radio">` nativo con aspecto de pastilla, en lugar de los `role="tab"` actuales.
    - Da gratis el teclado (flechas) y la semántica. Hoy los `role="tab"` no responden a las flechas, y las guías piden que si usas `role="tab"` se comporte como una pestaña completa.
    - El script queda en unas 10 líneas: al cambiar, mostrar el panel y guardar en `localStorage` (claves actuales: `getmcp-preferred-app` y la de `PackageManagerCommand`).
    - Opcional: paneles con `hidden="until-found"` para que la búsqueda del navegador (Ctrl+F) encuentre rutas y configs de otras apps. Necesita sincronizar en `beforematch`, y Safari no lo soporta. _(guía: `search-hidden-content`)_
  - Hoy cada una de las ~39.700 fichas carga `client.*.js` (213 KB, react-dom) y `ConfigViewer.*.js` (43 KB). Este arrastra todos los textos de `GUIDES` porque importa `APP_LABELS` desde `lib/guide-data.ts`.
  - Arregla de paso el parpadeo al hidratar: se pinta la primera pestaña o "npm" y luego salta a la preferencia guardada.
  - Archivos: `src/pages/servers/[id].astro:211,268`, `src/pages/guides/[app].astro:144`.
- [x] **A2. Quitar React donde sobra en el resto.**
  - Progreso: A2a hecho (home sin islas). `AsciiArt.astro` pinta las dos capas en estático (envoltorio `role="img" aria-label="getmcp"`, `<pre>` con `aria-hidden`) y revela la maciza con `motion-safe:animate-ascii-reveal` (`clip-path` 250 ms con `steps(40)`); se quita el cursor del revelado. `AnimatedCommand.astro` pinta el primer comando completo y su script arranca en la pausa tras escribir; actualiza el `data-copy` de los dos botones (`scripts/copy.ts`). `CliShowcase.astro` usa radios nativos (`name="cli-command"`) con `scripts/radio-panels.ts` y 10 paneles prerenderizados; las flechas recorren las tarjetas en orden lineal. Verificado renderizando cada componente aislado (Astro container frente a `renderToStaticMarkup` del `.tsx`): `<pre>` y texto iguales salvo lo esperado (capa maciza y comando inicial completos, `legend`, 9 paneles ocultos más). Comprobado con `astro dev`: 0 `astro-island`, sin `client.*.js`, 10 paneles (9 `hidden`). En navegador (Chromium y Firefox 157): sin JS el logo sale completo y se ve el panel `add`; con movimiento reducido no hay revelado, ni parpadeo, ni animación del comando; el comando no se vacía al cargar y copiar a mitad de animación copia el comando completo; las flechas recorren las tarjetas (con anillo de foco solo con teclado); en Firefox, tras elegir tarjeta y recargar, radio y panel coinciden; el LCP es el párrafo de la cabecera (608 ms), no el logo. Nota: el `dist/` antiguo (ignorado por git) hace que `scanner.globs` de `@tailwindcss/oxide` se cuelgue, y con él `astro dev` y el build parcial; para verificar se excluyó con `@source not "../../dist"` en una config temporal sin commitear. A2b hecho (404 sin React): `NotFound.astro` pinta en estático el 404 ASCII (envoltorio `role="img" aria-label="Error 404"`, capa maciza con `motion-safe:animate-ascii-reveal`, sin cursor de revelado), la terminal y el CTA; el barrido de scanline lleva `motion-reduce:hidden` y el cursor `motion-safe:animate-[blink_1s_step-end_infinite]`; un script de dos líneas escribe `location.pathname` en `[data-pathname]` (el HTML muestra `/unknown`, como el SSR anterior). Comprobado con `astro dev`: 0 `astro-island`, sin `client.*.js`; el `<pre>` de fondo es idéntico y el texto igual salvo la capa maciza completa. No se pudo probar en navegador (ninguno accesible desde esta máquina); se comprobó que el CSS generado incluye las tres utilidades de movimiento. A2c hecho (componentes solo de servidor a `.astro`): `ServerSidebar`, `CategoryGrid`, `PopularServers`, `SupportedApps`, `StatsBar`, `FormatShowcase`, `TeamFeatures`, `SecurityFeatures` y `DeveloperExperience` pasan a `.astro` (iconos de `@lucide/astro`; GitHub y Docker como `<svg>` en línea con las rutas de simple-icons, CC0) y se quita `@icons-pack/react-simple-icons`. `ServerCard` se duplica: `ServerCard.astro` para las páginas estáticas y `ServerCard.tsx` solo en la isla de `SearchBar`, con comentario de mantenerlos sincronizados; `ServerCardData` pasa a `lib/server-detail.ts`. `BadgeCheck` y `Lock` de `servers/[id].astro` pasan a `@lucide/astro`. Las páginas de servidor, categoría y home ya no renderizan React. El contenido de los `<pre>` va en el frontmatter o en una sola línea (Astro quita los saltos de línea con sangría junto a etiquetas, así que se conservan los `{" "}`). Verificado con `astro dev` antes/después (/, 6 servidores con y sin estadísticas, Docker, homepage, +N etiquetas y secretos, /category/ai y /category/developer-tools): `<pre>` idénticos byte a byte y texto, clases y atributos idénticos salvo atributos de SVG (solo cambia "hace 18h/19h" por la hora); 0 `astro-island` en esas páginas; `/servers` sigue renderizando las tarjetas de la isla. Nota: `@tailwindcss/oxide` volvió a colgarse escaneando `packages/web` (con `dist/`), y para verificar se limitó la fuente a `src` en una config temporal sin commitear. A2d hecho (docs sin React): `DocsContent.astro` y `DocsSidebar.astro` sustituyen a los `.tsx`; los 15 ejemplos usan `CodeBlock.astro` (que trae `scripts/copy.ts`), así que se quita el script transitorio de `docs.astro` y se borran `CodeBlock.tsx` y `hooks/use-clipboard.ts`. Las reglas del scroll-spy pasan, sin cambios, a `public/docs-scroll-spy.css`, enlazado desde el `<head>` de `docs.astro` (fuera del pipeline de CSS; cubre el paso del scroll-spy de A7). El diagrama ASCII va en el frontmatter porque la fila de guiones confunde la detección del frontmatter de oxlint. Verificado con `astro dev` antes/después: los 15 `<pre>` idénticos byte a byte (solo cambia `data-copy-text="true"` por el atributo sin valor), texto y secuencia de etiquetas/clases idénticos, 0 `astro-island`, 15 botones de copiar. No se pudo probar en navegador el scroll-spy ni el copiado (el script lee el `textContent` del `<code>`, igual que antes). React queda solo en la isla `SearchBar` de `/servers`.
  - `AsciiArt`: revelado con una animación CSS (`clip-path` con `steps()`) dentro de `@media (prefers-reduced-motion: no-preference)`. Así el logo se ve completo sin JS y sin animación para quien la desactiva. Hoy sin JS el logo macizo no aparece nunca.
  - `CliShowcase`: mismo patrón de radios que A1.
  - `AnimatedCommand` y `NotFound`: `.astro` más un script pequeño.
  - Componentes React que solo se renderizan en el servidor (ServerCard, ServerSidebar, CategoryGrid, PopularServers, SupportedApps, StatsBar, FormatShowcase, TeamFeatures, SecurityFeatures, DeveloperExperience, DocsContent, DocsSidebar, CodeBlock): pasarlos a `.astro`. Ojo, `ServerCard` también lo usa la isla `SearchBar`.
  - Ganancia: la home y el 404 sin react-dom, y menos `renderToString` en el build.
- [x] **A3. API de fuentes de Astro.** Hecho en `7e5d6b9`.
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
  - **Verificado** (en `astro dev`; falta confirmarlo en el próximo build de CI):
    - `symbols2` se resuelve.
    - La home y el 404 precargan `latin` y `symbols2`; el resto solo `latin` y no descargan `symbols2`.
    - El logo mide 424 px en la home y 365 px en el 404, igual que en producción.
    - En Windows, la fallback generada (Courier New) iguala los anchos de Fira Mono (423,8 px frente a 424 px).
    - Si el proveedor falla en CI, cambiar a `fontProviders.npm()` es una línea.
- [ ] **A4. Build incremental** (`experimental.incrementalBuild`, Astro 7.2 o posterior). **Aplazado:** el build se ejecuta en Vercel, así que hay que replantear dónde vive la caché antes de hacerlo.
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

- [x] **B1. `/servers` pesa 19,8 MB.** _Hecho: la página solo envía las 24 primeras tarjetas y el total; la isla carga `/servers.json` (endpoint estático, ~10 MB sin comprimir, ~1,8 MB brotli) tras hidratar, con `priority: "low"` si la URL no trae búsqueda, y muestra "Loading servers…" en otros estados. Se mantiene `client:load`._
  - El 99,5 % son los props de `<SearchBar client:load servers={…}>`: los ~39.700 servidores serializados en el atributo `props` (`src/pages/servers/index.astro:39-54,113`).
  - Propuesta: un endpoint estático compacto (`src/pages/servers.json.ts`) cargado desde la isla con `client:idle`, y la primera página de resultados en HTML estático para que los crawlers vean más de 24 enlaces. **Decidido:** JSON estático propio. **Futuro:** migrar la búsqueda a Pagefind.
- [x] **B2. `/category/ai` pesa 3 MB.** _Hecho: `src/pages/category/[slug]/[...page].astro` con `paginate()`, 48 por página (204 páginas; `/category/ai` y `/category/ai/2`…`/58`), ordenadas por estrellas de GitHub con las mismas tarjetas que `/servers`. El `ItemList` cubre solo la página actual; las páginas 2+ tienen canonical, título y descripción propios y no entran en el sitemap. `Pagination.tsx` admite `hrefFor` (enlaces, sin JS); helpers en `src/lib/pagination.ts`. `/category/ai` pasa de ~3 MB a ~118 KB._
  - 2.779 tarjetas sin paginar más ~300 KB de JSON-LD `ItemList` (`src/pages/category/[slug].astro:70-81,122-128`).
  - Propuesta: `paginate()` en `/category/[slug]/[...page].astro`, con el `ItemList` limitado a la página actual.
  - Si se descarta paginar, como mínimo añadir `content-visibility: auto` con `contain-intrinsic-size` a la cuadrícula de tarjetas por debajo del pliegue. No reduce los 3 MB, pero sí el coste de render. _(guía: `defer-rendering-heavy-content`)_
- [ ] **B3. Imágenes OG: unos 2,6 GB (66 KB × 39.700) y la mayor parte del tiempo de build.**
  - **Decidido:** mantener una OG propia por servidor y comprimir los PNG con paleta cuantizada. El aspecto no debe cambiar de forma apreciable. Las otras opciones descartadas: OG genérica con personalizadas solo para el top N.
  - **Medido** (4 OG reales, codificadas con `sharp`):
    - El PNG que genera `resvg` está mal comprimido: ~67 KB de media.
    - **Con paleta de 256 colores:** ~23 KB (−65 %), 0,00 % de píxeles distintos con umbral 0,1. Cada imagen tiene ~390 colores.
    - **Sin pérdida, nivel 9:** ~36 KB (−49 %), píxeles idénticos.
    - **JPEG:** más grande o con artefactos alrededor del texto.
    - **WebP:** algo más pequeño, pero su compatibilidad en previsualizaciones de enlaces no está garantizada.
  - **Elegido:** `sharp` con `png({ palette: true, colours: 256, dither: 1, compressionLevel: 9, effort: 4 })` sobre la salida de `resvg`. Cuesta ~45 ms por imagen, unos +4 min de build con concurrencia 8.
  - **Revisión del usuario:** al terminar, enseñar imágenes antes/después de varias OG. Si no convence, cambiar a sin pérdida (`png({ compressionLevel: 9 })`).
  - Borrar de paso `assets/Inter-SemiBold.ttf`, que no se usa (ver D2).

## C. Fallos (ya existían en Next.js)

- [x] **C1. Las 19 guías muestran "Popular Servers" vacío y sin "Example configuration".**
  - Los slugs de `src/lib/guide-data.ts` (`github`, `filesystem`, `brave-search`…) ya no existen; los reales son tipo `brave-brave-search`.
  - `src/pages/guides/[app].astro:52-68` falla en silencio. Además `sampleServerId = guide.popularServers[0]` puede no coincidir con el servidor elegido.
  - Propuesta: elegirlos desde el registry o las métricas, o validar los slugs en el build.
  - Hecho: se quita `popularServers` de `GuideData`. Las guías usan `getPopularOfficialServers()` (`src/lib/popular-servers.ts`, los 6 oficiales con más estrellas, igual que la home) con el título "Popular MCP Servers". El ejemplo usa el primero, con clave `server.id` y enlace a `server.slug`. `getPopularOfficialServers()` descarta entradas cuyo slug lleva a otro servidor. Tests en `tests/guides.test.ts`.
- [x] **C2. El JSON-LD no se escapa.**
  - `src/components/JsonLd.astro:9` usa `set:html={JSON.stringify(data)}` con descripciones de terceros. Un `</script>` en el registry rompería la página.
  - Arreglo: `.replace(/</g, "\\u003c")`. Mismo patrón en `DocsContent.tsx:12-57`.
  - Hecho: `serializeJsonLd()` en `src/lib/json-ld.ts`, usado por `JsonLd.astro`. El JSON-LD de `/docs` sale de `DocsContent.tsx` y pasa a `docs.astro` vía `<JsonLd>`, así que ya no queda `dangerouslySetInnerHTML`. Tests en `tests/json-ld.test.ts`. Solo cambia el HTML de los 10 servidores con `<` en nombre o descripción, y el JSON es equivalente.
- [x] **C3. Doble punto en la meta description de cada servidor** (`src/pages/servers/[id].astro:29`): "Sign in once.. Install with:". Hecho en `8585247`.
  - Afectaba a unas 31.000 fichas: 30.059 descripciones terminan en `.` y 1.016 en otra puntuación.
  - Arreglo: `toSentence()` en `src/lib/format.ts`. Recorta espacios, quita un `,` `:` o `;` final y añade punto solo si no termina ya en `.` `!` `?` `…`. Tests en `tests/format.test.ts`.
  - Las 5 descripciones que ya vienen mal del registry ("SEO..", "quickly!.") se dejan como están.
- [x] **C4. La home no tiene `h1` accesible:** `class="absolute hidden"` (`src/pages/index.astro:137`). Cambiar a `sr-only`.
  - Hecho: el `h1` de la home usa `sr-only` (`display:none` lo sacaba del árbol de accesibilidad). Al ser `position:absolute` no ocupa celda del grid, así que el hero no cambia.
- [x] **C5. El orden "alfabético" de `/servers`** ordena por ID inverso (`SearchBar.tsx:140-145`); debería ordenar por nombre.
  - Hecho: `sortServers()` en `src/lib/server-search.ts` (con `SortOption`, `DEFAULT_SORT`, `PAGE_SIZES`, `DEFAULT_PAGE_SIZE`). "Alphabetical" ordena por nombre con `Intl.Collator("en", { sensitivity: "base", numeric: true })`; los nombres que empiezan por puntuación van primero. Tests en `tests/server-search.test.ts`.
- [x] **C6. El botón "Browse servers" del 404 apuntaba a `/`.** Hecho en `430a357`.
- [ ] **C7. Cabecera móvil:** a 390 px la pastilla "beta" tapa "Servers" (`BaseLayout.astro:81-115`).
  - El flex no tiene `flex-wrap`, y las guías piden `flex-wrap: wrap` siempre que pueda desbordar. _(guía: `css-layout`)_
  - Propuesta: `flex-wrap` con `gap`, y ocultar la pastilla por debajo de `sm`. Alternativa: GitHub como icono.
- [x] **C8. Riesgos latentes.** Hecho: `CATEGORY_SLUGS` (`lib/categories.ts`) alimenta página, OG, sitemap (ordenado) y `CategoryGrid`; `GUIDE_NAMES` eliminado (OG usa `GUIDES[app].shortName ?? name`, endpoint con `GUIDE_SLUGS`). Rutas: aplazado por decisión del usuario, la comprobación queda en ROADMAP 6b Fase 2.
  - **Categorías:** la página filtra las que no tienen nombre (`category/[slug].astro:14-17`), pero el endpoint de OG y `lib/sitemap.ts:22` usan todas. Una categoría nueva produciría una URL que da 404 en el sitemap.
  - **Rutas:** `servers/foo.html` convive con la carpeta `servers/foo/` de la imagen OG (igual en guides y category). Hay que verificar en Cloudflare que `/servers/foo` no redirige a `/servers/foo/`. Si lo hace, mover las OG a `/og/...`.
  - **Guías:** `GUIDE_NAMES` en `og-pages.tsx:89-109` duplica `GUIDES[*].name`, y el endpoint de OG usa sus claves en vez de `GUIDE_SLUGS`.

## D. Limpieza

- [ ] **D1. Restos de Next.js:** borrar `packages/web/.next/`, `next-env.d.ts` y `tsconfig.tsbuildinfo` (761 KB). Quitar del `.gitignore` las entradas que se añadieron para ignorarlos. Revisar el `include: ["**/*"]` de `tsconfig.json`.
- [ ] **D2. Código y assets muertos:** `src/lib/security-headers.ts` (o se resuelve en A7), `@keyframes fade-in-up` (`globals.css`), `assets/Inter-SemiBold.ttf`. También `public/logo.svg` y `logo-light.svg`, que solo usa el README.
- [ ] **D3. Comentarios de Next.js y Vercel:** ~~`SearchBar.tsx:63`~~ (hecho en E8) y `ConfigViewer.tsx:30` ("server component" y `eslint-disable`), `BaseLayout.astro:17`, `og-image.tsx:82`.
- [x] **D4. Cifras escritas a mano.** Hecho en `f3b6385`. Queda opcional: "10 commands" (`StatsBar.tsx`, `CliShowcase.tsx`) podría salir de `COMMANDS.length`.

## E. Accesibilidad y SEO

- [x] **E1. Encabezados:** el 404 no tiene `h1`; "Configuration" en `ConfigViewer.tsx:47` es `h3` entre `h2` (ya `h2` desde A1); las categorías saltan de `h1` a las tarjetas `h3`. Hecho en E1: `<h1 class="sr-only">404: Page not found</h1>` en `404.astro` y el envoltorio del ASCII de `NotFound.astro` pasa a `aria-hidden="true"` (sin `role="img"`, para no anunciar "404" dos veces); `<h2 class="sr-only">Server listing</h2>` antes de la rejilla en `category/[slug]/[...page].astro` (mismo patrón que `SearchBar.tsx`). `ConfigViewer` ya se resolvió en A1.
- [x] **E2. ARIA y teclado:**
  - [x] Las pestañas de `ConfigViewer` no se manejan con las flechas, y el tabpanel apunta a pestañas ocultas en móvil. Resuelto en A1 (radios nativos).
  - [x] `PackageManagerCommand` no comunica qué opción está elegida. Resuelto en A1 (radios nativos).
  - [x] El "Copied" de los botones de copiar no se anuncia: añadir una región `aria-live="polite"`. _(guía: `accessibility`, sección Live Regions)_ Hecho en E7 (`scripts/copy.ts`).
  - [x] `FilterSheet` sigue siendo enfocable cuando está cerrado. Hecho en E2: `<dialog closedby="any">` con `showModal()`; se quitan el focus trap, el manejo de Esc, la restauración del foco, el bloqueo de scroll del `body` y el fondo falso; el evento `close` llama a `onClose` (props sin cambios, `SearchBar` intacto); fallback de clic en el fondo si no existe `closedBy`; `html:has(dialog:modal) { overflow: hidden }` en `globals.css`; sin animación. Verificado en Chromium a 390 px con `astro dev`: Tab no sale del diálogo, cerrado no es alcanzable con Tab, Esc y clic en el fondo cierran y devuelven el foco a "Filters", reabrir funciona, la página no hace scroll detrás; con el fallback forzado (sin `closedBy` ni atributo) el clic en el fondo cierra. Firefox y WebKit no probados (sin navegadores compatibles en la máquina). Propuesta: `<dialog>` nativo abierto con `showModal()`, con `closedby="any"` para cerrar al tocar fuera. _(guías: `accessibility` sección 12, `light-dismiss-a-dialog`)_
    - `showModal()` vuelve inerte el resto de la página, así que el focus trap hecho a mano (`FilterSheet.tsx:22-53`) se elimina.
    - Safari no soporta `closedby`: las guías dan un fallback de unas 10 líneas que cierra con un clic en el `::backdrop`.
  - [x] El `aria-label` de `AsciiArt.tsx:81` está en un `<pre>` sin rol. Resuelto en A2a (`role="img"` en el envoltorio de `AsciiArt.astro`).
  - El `<img>` del logo de la cabecera debería llevar `alt=""`. Lo cierra A8 (dueño de ese `<img>`); no se toca en E2.
- [x] **E3. Breadcrumbs consistentes:** categoría y guías usan `<span>`, sin `<ol>` ni `aria-current`. _Hecho: `components/Breadcrumbs.astro` (`items: { label, href? }[]`) en /servers, fichas, categorías (también páginas 2+, último elemento = nombre de la categoría) y guías: `nav[aria-label=Breadcrumb]` > `ol` con `flex-wrap`, separadores `/` con `aria-hidden`, último elemento `aria-current="page"` con `wrap-anywhere`. Todas empiezan por Home, como su JSON-LD (las fichas ganan "Home /"). Verificado en el build parcial y con Chromium a 390 px: sin scroll horizontal, los nombres largos se parten._
- [x] **E4. "Actualizado hace X" congelado en el build:** `ServerSidebar.tsx:232-234` usa `relativeTime(lastPush)` en el HTML estático. _Hecho: `ServerSidebar.astro` pinta `<time datetime={lastPush} data-relative-time title="Oct 8, 2026">Oct 8, 2026</time>` (`formatDate()`, UTC); `scripts/relative-time.ts` (solo en fichas) lo reescribe con `formatRelativeTime()` (`Intl.RelativeTimeFormat` narrow: "1d ago", "5mo ago"; mes = 30 días, año = 365; menos de un minuto o fecha futura dejan la fecha absoluta). `relativeTime()` eliminado. La fecha "Updated" sigue, así que E5 mantiene `lastPush`. Verificado en el build parcial y en Chromium: con JS "1d ago", sin JS "Oct 8, 2026"._
  - Propuesta: `<time datetime="…">` con la fecha absoluta en el HTML, y un script mínimo que la reescribe como relativa con `Intl.RelativeTimeFormat`, que es Baseline amplio.
  - Sin JS se ve la fecha absoluta, que nunca queda desfasada.
- [x] **E5. Sitemap con `lastmod` real:** `lib/sitemap.ts:77` pone la fecha del build a todas las URLs, así que Google ve unos 40.000 cambios al día. Usar la fecha real (por ejemplo `lastPush` de las métricas). _Hecho: cada ficha usa la fecha más reciente entre `updatedAt` del registro oficial y `lastPush` de GitHub (`serverLastModified()`); la home, `/servers` y las categorías (solo la página 1) usan la de su servidor más reciente; docs y guías omiten `<lastmod>`; cada entrada del índice usa la fecha más reciente de su trozo. Las URLs de fichas salen de `getServerPaths()`. Si E4 quita la fecha "Updated" de la ficha, quitar también `lastPush`._
- [ ] **E6. Head:**
  - Falta `og:url`.
  - El 404 hereda el `hreflang` de la home (`metadata.ts:84-89`).
  - Faltan `favicon.ico`, `apple-touch-icon` y el manifest.
  - Sobran los `twitter:image:*` no estándar y la meta `keywords`.
- [x] **E7. Copiar código:** `scripts/code-copy.ts:40` usa `closest(".rounded-lg")`, que es frágil (mejor un atributo `data-`), y se incluye en las ~39.700 fichas aunque no tengan `CodeBlock`. A los botones de `CodeBlock.tsx:24` les falta `type="button"`.
  - Hecho: `scripts/code-copy.ts` pasa a `scripts/copy.ts`, con contrato de atributos (`data-copy`, `data-copy-root`, `data-copy-text`, `data-copied`) y una región `aria-live` compartida. Nuevo `CodeBlock.astro` (iconos de `@lucide/astro`) en las guías. El script ya no se importa en `BaseLayout`, solo en los componentes y páginas con botones de copiar (`/docs` lo importa de forma transitoria hasta A2d).
  - Pendiente (fuera de alcance): en `/docs` todos los botones se llaman "Copy code"; se podría añadir `aria-describedby` hacia el encabezado de la sección.
  - Pendiente (fuera de alcance): hoy ninguna guía muestra el ejemplo de configuración, porque los `popularServers` de `lib/guide-data.ts` (`github`, `filesystem`…) no coinciden con ningún slug del registro y `getSampleConfig()` devuelve `null`. Hay que pasarlos a slugs reales.
- [x] **E8. `?page=` fuera de rango en `/servers`:** se corrige en pantalla, pero la URL conserva el valor erróneo. _Hecho: `readSearchState()` y `toSearchString()` en `lib/server-search.ts` validan la URL (listas con lista blanca y sin duplicados, `sort`/`per_page` conocidos, `page` entero positivo) y la isla la reescribe en forma canónica con `replaceState` al cargar; `?page=` se acota cuando llega el índice, `?q=` restaurado ya no se pierde durante el debounce y se conservan parámetros ajenos (`utm_\*`). `RUNTIMES`/`TRANSPORTS`pasan a`server-search.ts`. Se quitó el comentario "server component" y el `eslint-disable`de`SearchBar.tsx` (D3 ya no debe tocar ese archivo).\_

## Orden sugerido

1. C y D (fallos y limpieza), más E de bajo esfuerzo.
2. A3, A5, A6 y A8 (mejoras rápidas de Astro).
3. A1, A2, B1 y B2 (fuera React y páginas más ligeras).
4. A4, A7 y B3 (necesitan decisiones de CI y de hosting).
