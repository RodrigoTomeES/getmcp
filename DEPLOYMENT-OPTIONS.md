# Opciones de despliegue de la web para no superar el plan gratuito

> Documento de trabajo (octubre 2026). Recoge el diagnóstico del consumo en Vercel y todas las alternativas valoradas para `packages/web`.

---

## 1. Diagnóstico

### Consumo del último ciclo en Vercel (plan Hobby)

| Métrica              | Uso     | Límite Hobby (aprox.) | Estado            |
| -------------------- | ------- | --------------------- | ----------------- |
| ISR Writes           | 1,3M    | 200K                  | **~650%**         |
| Fluid Active CPU     | 11h 14m | 4h                    | **~280%**         |
| Fast Origin Transfer | 20,5 GB | 10 GB                 | ~200%             |
| ISR Reads            | 1,3M    | 1M                    | ~130%             |
| CDN Requests         | 1,1M    | 1M                    | ~110%             |
| Function Invocations | 250K    | 1M                    | OK                |
| Fast Data Transfer   | 36,5 GB | 100 GB                | OK                |
| Web Analytics        | 8,9K    | —                     | OK                |
| Build CPU            | 2h 32m  | —                     | (deploys diarios) |

### Causas

1. **39.013 servidores, solo 6 prerenderizados.** `getPopularOfficialServers()` usa `POPULAR_SERVERS_LIMIT = 6`; el resto se renderiza bajo demanda (`dynamicParams = true`) → cada primera visita = function invocation + CPU + ISR write.
2. **El sitemap lista las 39.000 fichas** → Googlebot, GPTBot, ClaudeBot, etc. las recorren todas, incluida su `opengraph-image` (`ImageResponse`/satori, lo más caro en CPU).
3. **El sync diario provoca un deploy diario**, y en Vercel **la caché ISR es por deployment**: cada deploy empieza en frío y los crawlers regeneran todo otra vez. Por eso ISR Writes ≈ ISR Reads.

### Cuánto cambia realmente el registry al día

| Sync       | Total  | Añadidos | Borrados | Modificados |
| ---------- | ------ | -------- | -------- | ----------- |
| 2026-10-06 | 39.013 | 798      | 22       | 1.247       |
| 2026-10-04 | 38.237 | 447      | 8        | 1.057       |
| 2026-10-03 | 37.798 | 372      | 22       | 599         |

→ Solo cambia un **3–5%** al día; hoy se paga por regenerar el 100%.

---

## 2. Opciones

### Opción A — Cloudflare como CDN delante de Vercel (Next.js actual)

Cloudflare cachea HTML, assets y OG images; Vercel solo recibe los _cache miss_.

**Configuración DNS** (nameservers de DonDominio → Cloudflare; los `.es` los aplica Red.es en ventanas horarias, no al momento):

| Tipo  | Nombre    | Valor                                    | Proxy                         |
| ----- | --------- | ---------------------------------------- | ----------------------------- |
| A     | `@`       | `216.198.79.1` (IP de Vercel)            | Gris → naranja tras verificar |
| CNAME | `www`     | `cname.vercel-dns.com`                   | Gris → naranja tras verificar |
| TXT   | `_vercel` | `vc-domain-verify=...` (uno por dominio) | DNS only                      |
| CAA   | `@`       | letsencrypt / pki.goog / sectigo         | DNS only                      |

**Pasos tras activar la zona:**

1. Vercel → _Refresh_ en ambos dominios hasta "Valid Configuration".
2. Cloudflare → SSL/TLS **Full (strict)** (con _Flexible_ hay bucles de redirección).
3. Pasar `@` y `www` a **Proxied**.
4. **Cache Rule** → _Eligible for cache_:

   ```
   (http.host eq "getmcp.es"
    and not starts_with(http.request.uri.path, "/_vercel")
    and not starts_with(http.request.uri.path, "/api")
    and not starts_with(http.request.uri.path, "/.well-known")
    and not any(http.request.headers["rsc"][*] == "1"))
   ```

   - Edge TTL: _Ignore cache-control header_, 7–30 días (Vercel envía `max-age=0, must-revalidate`).
   - Browser TTL: _Respect origin_. Cache key con query string (por defecto).
   - **Excluir la cabecera `RSC` es obligatorio**: Next sirve HTML o payload RSC en la misma URL según esa cabecera y Cloudflare ignora `Vary`.

5. **Tiered Cache** activado (gratis): evita que cada PoP pida al origen por separado.
6. **Security → Bots**: _Block AI bots_ + _Bot Fight Mode_.

**Ventajas:** sin cambios de código; Cloudflare como proxy no tiene límites de CPU/peticiones/ancho de banda en Free; la caché de Cloudflare **sobrevive a los deploys de Vercel**.
**Inconvenientes:** Vercel desaconseja proxies delante (su firewall/logs ven IPs de Cloudflare); doble CDN; las navegaciones cliente (RSC) siguen llegando a Vercel; Cloudflare puede desalojar páginas poco visitadas antes de su TTL.

> ⚠️ **No purgar toda la caché en cada deploy** — eso reproduce el problema del reset diario. Ver opción C.

---

### Opción B — Dejar de desplegar con cada sync diario

Los commits `chore(registry): daily sync [skip ci]` disparan deploy en Vercel (Vercel no respeta `[skip ci]`).

- **Ignored Build Step** en Vercel que salte los commits que solo tocan `packages/registry/data/`.
- Deploy programado (p. ej. semanal) para publicar los datos acumulados.

**Ventajas:** cambio de minutos; la caché ISR del deployment vivo dura días/semanas; elimina casi todo el Build CPU.
**Inconvenientes:** las fichas tardan hasta una semana en reflejar el registry.

---

### Opción C — Cloudflare + purga incremental por tags (recomendada a corto plazo)

Extensión de A: Cloudflare es la caché persistente y solo se invalida lo que cambia.

1. Vercel responde con `Cache-Tag: server:<id>` (fichas) y `Cache-Tag: listing` (home, `/servers`, categorías, sitemap).
2. Cloudflare cachea con TTL largo.
3. El sync puede seguir desplegando a diario (los deploys de Vercel dejan de importar).
4. Tras el deploy, el workflow calcula el diff (añadidos/borrados/modificados) y llama a la API de Cloudflare `purge_cache` con los tags afectados (purga por tag disponible en Free desde 2025; alternativa: purga por URL en lotes de 30).

**Resultado:** de ~39.000 regeneraciones por deploy a ~1.000–2.000/día, y solo cuando alguien visita esas páginas.
**Funciona igual con Next.js o Astro** — no requiere migrar.

---

### Opción D — Revalidación incremental en Vercel (sin Cloudflare)

Desacoplar datos y deploy dentro de Vercel:

1. Ignored Build Step (opción B) para no desplegar con el sync.
2. Las páginas leen los datos **en runtime** (JSON por servidor en R2/GitHub raw/Blob, `fetch` con tags) en lugar de importarlos de `@getmcp/registry`.
3. El sync llama a un endpoint protegido `/api/revalidate` → `revalidatePath('/servers/<slug>')` / `revalidateTag()` solo para los cambiados + listados.

**Ventajas:** sin proxy, todo dentro de Vercel.
**Inconvenientes:** cambio de arquitectura (la web deja de usar `@getmcp/registry` en runtime); sigue sujeto a los límites de ISR/CPU de Vercel; un deploy de código sigue regenerando todo.

---

### Opción E — Astro en Vercel + Cloudflare CDN

Igual que C pero con Astro. Las fichas en SSR con **Route Caching** (`Astro.cache.set({ maxAge, swr, tags })`).

- El render y las OG images siguen en Vercel (satori sin límites de 10 ms).
- **Ojo:** el provider de caché de Vercel invalida la caché de Vercel, no la de Cloudflare → la purga en Cloudflare hay que hacerla igualmente desde el sync.
- Ventaja frente a Next: no hay payloads RSC, así que toda la navegación es cacheable.

---

### Opción F — Astro en Cloudflare Workers (sin Vercel)

- Adaptador `@astrojs/cloudflare` + Route Caching con provider de Cloudflare (Workers Cache, purga por tag integrada vía `cache.invalidate()`).
- Datos en **R2/KV**; el sync sube los cambios e invalida tags → **sin deploys para datos**.
- Sin límites de ancho de banda; caché que no depende de deploys.

**Inconvenientes:**

- Workers Free: **10 ms de CPU por petición** → las OG images con satori/resvg no caben; requiere Workers Paid (5 $/mes) o pregenerarlas.
- Pages/Workers static assets: **20.000 archivos** en Free (100.000 en Paid) → no se pueden publicar las 39.000 fichas como estáticas; hay que usar SSR + caché.
- Los providers de caché CDN de Astro siguen siendo **experimentales**.

---

### Opción G — Exportación estática total

`output: 'export'` (Next) o build estático (Astro) y servir desde un CDN.

**Tal cual, no cabe en ningún hosting gratuito.** Build real de la rama Astro medido en CI ([run 37233860090](https://github.com/RodrigoTomeES/getmcp/actions/runs/37233860090), `scripts/measure.ts`):

|                                   | Archivos   | Tamaño                 |
| --------------------------------- | ---------- | ---------------------- |
| HTML                              | 38.088     | 1.444 MB               |
| OG images (PNG)                   | 38.087     | 2.651 MB (media 71 KB) |
| Resto (JS, CSS, fuentes, sitemap) | 28         | 6 MB                   |
| **Total**                         | **76.203** | **4.102 MB**           |
| Proyección +20% servidores        | 91.444     | 4.922 MB               |

- Build completo (páginas + OG): **22 min** en GitHub Actions, ~20 de ellos en OG images. Con el degradado nativo ya implementado: **9 min 41 s** (ver _Rendimiento de la generación de OG images_).
- GitHub Pages (1 GB) ❌ · Cloudflare Free (20K archivos) ❌ · Cloudflare Workers Paid (100K archivos) ✅ pero de pago.

Las OG images son la mitad de los archivos y 2/3 del peso → sacarlas del deploy lo hace viable en Vercel (opción H).

---

### Opción H — Astro estático en Vercel + OG images en R2

Port 1:1 de la rama Astro (todo estático, sin funciones ni ISR) repartido en dos sitios:

```
GitHub Actions (sync diario)              Vercel (build por Git, como ahora)
 ├─ genera solo las OG nuevas/cambiadas    ├─ astro build SIN OG images
 └─ las sube a R2 (bucket getmcp-og)       └─ 38K HTML estáticos (~1,4 GB)
            │                                          │
   og.getmcp.es (custom domain de R2)         www.getmcp.es
            └──────────── Cloudflare (caché) ──────────┘
```

1. **Bucket R2** con custom domain `og.getmcp.es` (un clic con la zona ya en Cloudflare; la caché de Cloudflare va delante automáticamente).
2. **Workflow en GitHub Actions** que genera las OG y sube **solo las que cambian** (`rclone sync --checksum` o manifiesto de hashes en el bucket). Necesario porque R2 Free da **1M escrituras/mes**: subir las 38K a diario serían ~1,1M/mes.
3. **Astro:** flag para no generar OG en el build de Vercel y `og:image` apuntando a `https://og.getmcp.es/servers/<slug>.png`.
4. **Vercel** construye y sirve solo el HTML: build más corto (el de 22 min incluía las OG) dentro del límite de 45 min, y [sin límite de archivos de salida](https://vercel.com/docs/limits) en builds hechos por Vercel. Los límites de 100 MB / 15.000 archivos son para subidas por CLI (`vercel deploy --prebuilt`); un [changelog de junio 2026](https://vercel.com/changelog/cli-deployment-limits-removed) dice haberlos quitado, sin detallar cuáles → si se quiere construir en CI, probar un deploy y ver si pasa.

**Límites R2 Free:** 10 GB almacenamiento (se usarían ~2,7 GB), 1M escrituras/mes, 10M lecturas/mes (con caché delante, muy pocas), **egress gratis**.

**Ventajas:** 0 €; sin ISR Writes ni CPU de funciones en Vercel; el build en Vercel no consume la cuota de Fluid Active CPU; los deploys diarios pueden seguir; es la migración ya hecha, solo cambia dónde viven las OG.
**Inconvenientes / a vigilar:**

- **Deployment Storage** de Vercel: ~1,4 GB por deploy diario. Probablemente deduplica archivos idénticos entre deploys (sin confirmar) → revisar el contador tras 2–3 deploys y, si crece, ajustar _Deployment Retention_.
- Cada sync sigue reconstruyendo las 38K páginas (aunque solo cambie un 3–5%).
- Dos piezas que coordinar: si una OG nueva aún no está en R2, la ficha apunta a una imagen inexistente hasta el siguiente sync → generar/subir las OG **antes** de que se despliegue el commit del sync.

#### Variante H2 — Todo el sitio en R2 (sin Vercel)

Subir todo `dist/` (~4,1 GB) a R2 y servirlo desde `www.getmcp.es`.

- Cloudflare **Transform Rules** (gratis) para reescribir `/servers/x` → `servers/x.html`, `/` → `index.html`, y añadir cabeceras de seguridad.
- **Ventajas:** 0 €, sin ningún límite de Vercel; cabe en los 10 GB de R2.
- **Inconvenientes:** sin deploys atómicos (mientras sincroniza conviven archivos nuevos y viejos); 404 personalizado más difícil; un cambio de layout reescribe ~76K archivos (bien de forma puntual, no muchas veces al mes por el límite de 1M escrituras).
- La infraestructura de R2 de H se reutiliza → H es un paso intermedio natural hacia H2.

---

### Optimizaciones complementarias (cualquier opción)

- **OG images genéricas** (por categoría o plantilla única) para servidores no populares → elimina la mayor parte del CPU.
- **Generación de OG más rápida** (ver abajo) → de ~20 min a segundos por sync.
- Bloquear crawlers de IA (Cloudflare o `robots.ts`).
- Reducir `sampleRate` de Speed Insights si algún día se acerca al límite.

#### Rendimiento de la generación de OG images

Benchmark local (oct 2026) con 200 servidores reales del registry y el código de `og-server.tsx` de la rama Astro (satori + `@resvg/resvg-js`). En el build de CI las OG ocupan **~20 de los 22 min** (38.081 imágenes; las 38K páginas HTML, ~1,7 min).

**Dónde se va el tiempo (por imagen, 1 hilo):**

| Fase                            | Original    | Degradado nativo   |
| ------------------------------- | ----------- | ------------------ |
| satori (layout + texto → paths) | 8,1 ms      | 7,6 ms             |
| **resvg (rasterizado)**         | **34,0 ms** | **6,2 ms**         |
| PNG encode                      | 9,7 ms      | 9,6 ms             |
| **Total**                       | **52 ms**   | **23,6 ms (2,2×)** |

**Causa:** lo caro no es el texto ni las partes repetidas, sino el degradado radial de la esquina. Satori convierte `radial-gradient` en un `<pattern>` con máscaras anidadas y, por el `overflow: hidden` del contenedor raíz, aplica además una máscara a todo el lienzo 1200×630; resvg la compone en cada imagen.

**Solución:** quitar el degradado del árbol de satori (y el `overflow: hidden`) e inyectar tras el `<rect>` de fondo del SVG resultante un `<radialGradient>` nativo con la misma geometría:

```svg
<radialGradient id="og-glow" cx="1100" cy="100" r="424.26406871192853" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="rgb(59,130,246)" stop-opacity="0.15"/>
  <stop offset="0.7" stop-color="rgb(0,0,0)" stop-opacity="0"/>
</radialGradient>
<circle cx="1100" cy="100" r="300" fill="url(#og-glow)"/>
```

Comparación píxel a píxel con la imagen original: **diferencia máxima 1/255 por canal** (visualmente idénticas). Aplica también a `og-image.tsx` (resto de páginas), que usa el mismo degradado.

| Variante probada                                                          | ms/img   | Resultado                                                               |
| ------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| Original                                                                  | 52       | —                                                                       |
| Solo quitar `overflow: hidden`                                            | 44,5     | Idéntica (1/255)                                                        |
| **Degradado SVG nativo** (incluye quitar `overflow: hidden`; no se suman) | **23,6** | **Idéntica (1/255)**                                                    |
| Fondo pre-renderizado como PNG + solo texto encima                        | 76       | ❌ Más lento: resvg decodifica y compone el PNG 1200×630 en cada imagen |

**Multihilo:** satori es JS síncrono, así que dentro de `astro build` las OG se generan en un solo núcleo (`concurrency: 8` no lo cambia). Con un pool de workers (`tinypool`, ya en dependencias):

|                  | 1 hilo   | 4 workers | 8 workers |
| ---------------- | -------- | --------- | --------- |
| Original         | 19 img/s | 69 img/s  | 98 img/s  |
| Degradado nativo | 42 img/s | 152 img/s | 215 img/s |

**Tiempo de las OG en CI** (las dos primeras filas medidas en GitHub Actions; el resto, proyección desde el benchmark local):

| Escenario                                           | Tiempo OG        | Build completo                  | Fuente                                                                                                                             |
| --------------------------------------------------- | ---------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Original                                            | ~20 min          | 21 min 59 s (38.088 páginas)    | ✅ Medido, [run 37233860090](https://github.com/RodrigoTomeES/getmcp/actions/runs/37233860090)                                     |
| **Degradado nativo dentro de Astro (implementado)** | **~8,5 min**     | **9 min 41 s (39.223 páginas)** | ✅ Medido, [run 37692302032](https://github.com/RodrigoTomeES/getmcp/actions/runs/37692302032) — **−56%** con un 3% más de páginas |
| Degradado nativo + script aparte con 4 workers      | ~4–5 min         | —                               | Proyección                                                                                                                         |
| **+ incremental (solo OG cuyos datos cambian)**     | **segundos/día** | —                               | Proyección                                                                                                                         |

La proyección de ~9 min del benchmark local se cumplió en CI (~8,5 min), así que las filas proyectadas son razonablemente fiables.

> **Nota de fidelidad visual:** producción (Next.js 16.2.4 → `@vercel/og` 0.11.1) usa **satori 0.25.0**; la rama Astro instaló **satori 0.35.0**, que mide el texto algo distinto (títulos ~2–3 px más anchos por el `letterSpacing`). No lo causa el degradado. Para un port 1:1, fijar `satori@0.25.0` (verificado compatible con `addOGGlow`).

**Incremental:** una OG de servidor solo depende de nombre, descripción, categorías, id, transporte y la versión de la plantilla. Un hash de esos campos por servidor permite regenerar (y subir a R2, opción H) solo las que cambian; de los ~1.000–2.000 servidores modificados al día, muchos solo cambian métricas que no salen en la imagen.

---

## 3. Comparativa de opciones

| Opción                                 | Esfuerzo         | Cambios de código               | ¿Resuelve ISR Writes?         | ¿Resuelve CPU?         | Coste                                 |
| -------------------------------------- | ---------------- | ------------------------------- | ----------------------------- | ---------------------- | ------------------------------------- |
| A. Cloudflare delante                  | Bajo             | No                              | Parcial (si no se purga todo) | Parcial                | 0 €                                   |
| B. Sin deploy diario                   | Muy bajo         | Config Vercel                   | Sí (datos con retraso)        | Parcial                | 0 €                                   |
| C. Cloudflare + purga por tags         | Medio            | Cabecera + workflow             | **Sí**                        | **Sí**                 | 0 €                                   |
| D. Revalidación en Vercel              | Alto             | Arquitectura de datos           | Sí                            | Parcial                | 0 €                                   |
| E. Astro + Vercel + Cloudflare         | Alto (migración) | Migración                       | Sí                            | Sí                     | 0 €                                   |
| F. Astro en Workers                    | Alto (migración) | Migración + datos en R2         | Sí                            | Sí (OG aparte)         | 0–5 $/mes                             |
| G. Estático total (un solo hosting)    | —                | —                               | —                             | —                      | No cabe gratis (76K archivos, 4,1 GB) |
| H. Astro estático en Vercel + OG en R2 | Medio            | Flag OG + workflow R2           | **Sí** (sin ISR)              | **Sí** (sin funciones) | 0 €                                   |
| H2. Todo en R2                         | Medio            | Workflow R2 + reglas Cloudflare | **Sí**                        | **Sí**                 | 0 €                                   |

**Recomendación:** A + B ya, C cuando el DNS esté activo. Con la migración a Astro ya hecha (port 1:1 estático), **H** es la salida gratuita más directa: no requiere pasar las fichas a SSR y deja la puerta abierta a H2 si Vercel da problemas.

---

## 4. Next.js vs Astro para este proyecto

| Aspecto                      | Next.js (App Router, actual)                                                            | Astro                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Modelo                       | React en servidor y cliente; RSC                                                        | HTML por defecto, JS solo en "islas"                                                                                            |
| JS enviado al cliente        | Runtime de React + payloads RSC                                                         | Mínimo (solo componentes interactivos)                                                                                          |
| Rendering de 39K fichas      | ISR (`dynamicParams`, `revalidate`)                                                     | SSR bajo demanda + Route Caching                                                                                                |
| Caché incremental            | ISR **ligado a cada deployment** en Vercel; `revalidatePath`/`revalidateTag`            | Route Caching con tags, en el CDN (**sobrevive a deploys**); providers Vercel/Cloudflare experimentales                         |
| Datos                        | Imports / `fetch` con tags                                                              | Content Layer (Astro 5+: data store incremental entre builds, solo datos) y Live Content Collections (runtime, con `cacheHint`) |
| Detrás de un CDN externo     | Complicado: misma URL sirve HTML o RSC según cabecera `RSC`; hay que excluirlo de caché | Sencillo: una URL = un HTML                                                                                                     |
| Navegación cliente           | SPA con prefetch RSC (rápida, pero peticiones extra al origen)                          | MPA (opcional View Transitions); todo cacheable                                                                                 |
| Hosting idóneo               | Vercel (integración nativa)                                                             | Agnóstico: Vercel, Cloudflare, Netlify, Node                                                                                    |
| En Cloudflare Workers        | Vía OpenNext, más fricción                                                              | Adaptador oficial                                                                                                               |
| OG images                    | `next/og` integrado                                                                     | Endpoint con satori/`@vercel/og` (manual)                                                                                       |
| Analytics Vercel             | `@vercel/analytics` / Speed Insights nativos                                            | También disponibles vía adaptador / script                                                                                      |
| Componentes React existentes | Directos                                                                                | Reutilizables como islas (`@astrojs/react`)                                                                                     |
| Coste de migrar              | —                                                                                       | Alto: reescribir páginas/layouts; los componentes interactivos se reaprovechan                                                  |

**Resumen:** para el problema de costes, **la migración no es necesaria** — la opción C funciona con Next. Astro aporta HTML más ligero, cacheo trivial detrás de cualquier CDN y libertad de hosting; tiene sentido si se busca eso, no solo por el plan gratuito.

---

## 5. Referencias

- [Astro — Route caching](https://docs.astro.build/en/reference/experimental-flags/route-caching/)
- [Vercel Community — Persisting ISR cache across deploys](https://community.vercel.com/t/persisting-isr-cache-across-builds-deploys/30696)
- [Vercel Community — Losing ISR cache on each deploy](https://community.vercel.com/t/losing-my-isr-cache-data-every-time-i-do-a-deploy/26477)
- [Vercel — Limits](https://vercel.com/docs/limits)
- [Vercel — CLI deployment limits removed (jun 2026)](https://vercel.com/changelog/cli-deployment-limits-removed)
- [Cloudflare — Increased static asset limits (Workers Paid 100K)](https://developers.cloudflare.com/changelog/2025-09-02-increased-static-asset-limits/)
- [Cloudflare — R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [DonDominio — Actualización de DNS en dominios .es](https://www.dondominio.com/es/help/314/actualizacion-los-servidores-dns-los-dominios-es/)
