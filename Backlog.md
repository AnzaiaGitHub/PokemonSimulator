# Backlog — Pokédex + Equipo + Simulador de Batalla (Angular)

## 1. Visión

Aplicación web en Angular para explorar Pokémon con datos de PokéAPI, armar un equipo de 6, personalizar sus movimientos y simular batallas. Todo lo descargado se guarda en el navegador para respetar el *fair use* de la API y poder consultarlo sin conexión.

## 2. Decisiones de diseño

| Tema | Decisión |
|---|---|
| Framework | Angular (última versión estable), componentes *standalone*, signals, `OnPush`, TypeScript `strict` |
| Estructura | Por *features*: `core/`, `shared/`, `features/pokedex`, `features/team`, `features/battle`, `features/trainers` |
| Datos | PokéAPI, sin backend propio |
| Persistencia | **IndexedDB** (con Dexie o `idb`), nunca `localStorage` para datos grandes |
| Offline | Solo datos en IndexedDB. La app necesita conexión para cargar; lo ya descargado se lee sin red. **PWA/Service Worker fuera de alcance** |
| "Habilidades" | Se interpreta como **movimientos** (4 por Pokémon). Las *abilities* pasivas quedan fuera |
| Batalla | Fórmula **simplificada** (nivel fijo 50, sin IVs/EVs/naturaleza). Fórmula fiel = épica futura |
| Motor de batalla | Funciones puras, sin dependencias de Angular, con RNG con semilla para poder testear |
| Estado | Stores con signals (`signal`, `computed`, `effect`); RxJS para HTTP y búsqueda |
| Tests | Unitarios en caché, reglas del equipo y motor de batalla; `fake-indexeddb` para la capa de datos |

### Esquema inicial de IndexedDB

| Store | Clave | Índices | Contenido |
|---|---|---|---|
| `meta` | `key` | — | versión de esquema, fecha de sincronización |
| `pokemonIndex` | `name` | `id` | lista completa (nombre + id), una sola descarga |
| `pokemon` | `id` | `name`, `fetchedAt` | detalle: stats, tipos, learnset (nombres de movimientos) |
| `moves` | `name` | `type`, `damageClass`, `fetchedAt` | poder, precisión, PP, tipo, clase |
| `types` | `name` | — | relaciones de daño (×0, ×0.5, ×2) |
| `sprites` | `pokemonId` | — | imagen como `Blob` |
| `teams` | `id` | `trainerId` | 6 slots con Pokémon y movimientos elegidos |
| `trainers` | `id` | — | nombre y equipos (para 4.1) |

## 3. Definition of Done (aplica a toda historia)

- [ ] Cumple todos sus criterios de aceptación.
- [ ] Sin `any`, sin errores de ESLint, formateado con Prettier.
- [ ] Componentes con `ChangeDetectionStrategy.OnPush` y suscripciones cerradas (`takeUntilDestroyed` o `async`).
- [ ] Lógica en servicios/stores, componentes solo para la vista.
- [ ] Tests donde lo indique la historia; CI en verde.
- [ ] Accesible con teclado, con `alt` y etiquetas; responsive.
- [ ] Documentado en el README si cambia algo visible para quien lo use.

## 4. Mapa de requerimientos

| Requerimiento | Épicas |
|---|---|
| 1. Persistencia y *rate limit* | E1, E5 |
| 2. Equipo de 6 slots | E3 |
| 3. Modificar movimientos | E4 |
| 4. Simulador de batalla (opcional) | E6 |
| 4.1 Entrenadores y batalla de equipos (experimental) | E7 |

**Prioridad**: 🔴 Must · 🟡 Should · 🟢 Could. **Estimación**: puntos (1 pt ≈ 1–2 h).

---

## E0 — Fundamentos del proyecto

**Objetivo**: base limpia y desplegable antes de escribir funcionalidad.

### US-001 🔴 Crear el proyecto (2 pts)
Como desarrollador quiero un proyecto con configuración estricta para mantener calidad desde el inicio.
- [x] Proyecto creado con Angular CLI, *standalone*, `strict: true`.
- [x] ESLint y Prettier configurados con script `npm run lint`.
- [x] Estructura de carpetas por *features*.
- [x] URL de la API en `environment`, no escrita en el código.

### US-002 🟡 CI y README inicial (2 pts)
- [ ] GitHub Actions ejecuta lint, tests y build en cada push. *(pospuesto a propósito)*
- [x] README con descripción, cómo ejecutar y cómo testear.

### US-003 🔴 Shell de la aplicación y rutas con lazy loading (3 pts)
- [x] Header con navegación: Pokédex, Mi equipo, Batalla, Ajustes.
- [x] Cada *feature* se carga con `loadChildren`/`loadComponent`.
- [x] Ruta comodín con página 404.

### US-004 🔴 Modelos tipados y *mappers* (3 pts)
- [x] Interfaces para las respuestas de PokéAPI separadas de los modelos de dominio (`Pokemon`, `Move`, `PokemonType`, `TeamSlot`).
- [x] *Mappers* de respuesta → dominio con tests.
- [x] El resto de la app solo consume modelos de dominio.

---

## E1 — Capa de datos y persistencia local (Req. 1)

**Objetivo**: ninguna pantalla llama a la API directamente; todo pasa por un repositorio con caché.

### US-010 🔴 Base de datos IndexedDB versionada (5 pts)
Como usuario quiero que lo descargado se guarde ordenado en mi navegador.
- [x] Stores e índices del esquema de la sección 2.
- [x] Versión de esquema con migraciones; subir de versión no borra datos del usuario (equipos).
- [x] Servicio `LocalDb` con API tipada, sin exponer Dexie/`idb` fuera de `core/`.
- [x] Si IndexedDB no está disponible (modo privado, error), la app sigue funcionando solo en memoria y avisa al usuario.

### US-011 🔴 Cliente HTTP con control de *rate limit* (5 pts)
- [x] Cola de peticiones con concurrencia máxima configurable (por defecto 4).
- [x] Reintentos con *backoff* exponencial ante `429` y `5xx`, con máximo de intentos.
- [x] Deduplicación: dos peticiones simultáneas a la misma URL generan una sola llamada.
- [x] Interceptor que traduce errores a un tipo propio (`NetworkError`, `NotFoundError`, `RateLimitError`).
- [x] Tests con `HttpTestingController`.

### US-012 🔴 Repositorio con política de caché (5 pts)
- [x] Métodos: `getPokemon`, `getMove`, `getType`, `getPokemonIndex`.
- [x] Política **cache-first**: si existe en IndexedDB, no se llama a la API.
- [x] *Stale-while-revalidate*: si el dato supera el TTL (configurable), se muestra el guardado y se actualiza en segundo plano si hay red.
- [x] Sin red y sin dato local, devuelve un error claro (no una pantalla en blanco).
- [x] Cada respuesta indica su origen (`cache` | `network`) para depuración.

### US-013 🔴 Índice local de Pokémon (3 pts)
- [x] En el primer arranque se descarga la lista completa (una sola llamada con límite alto) y se guarda en `pokemonIndex`.
- [x] La búsqueda por nombre se hace contra el índice local, sin llamadas a la API.
- [x] Barra de progreso o estado visible durante la primera carga.

### US-014 🔴 Precarga de tipos (3 pts)
- [x] Los 18 tipos con sus relaciones de daño se descargan y guardan una sola vez.
- [x] Disponibles offline para el cálculo de efectividad.

### US-015 🟡 Estado de conexión y origen de datos (2 pts)
- [x] Signal `isOnline` basada en `navigator.onLine` y eventos `online`/`offline`.
- [x] Banner discreto "Sin conexión: mostrando datos guardados".

### US-016 🟡 Gestión del almacenamiento (3 pts)
- [x] Pantalla Ajustes con tamaño aproximado usado (`navigator.storage.estimate`).
- [x] Solicita almacenamiento persistente (`navigator.storage.persist`) y muestra el resultado.
- [x] Botón "Borrar caché de datos" que **conserva** equipos y entrenadores.
- [x] Confirmación antes de borrar.

### US-017 🟡 Sprites guardados como Blob (3 pts)
Sin esto, las imágenes no se verían sin conexión.
- [x] Al ver un Pokémon, su sprite se guarda en `sprites` y se muestra desde ahí.
- [x] Si falla, se muestra una imagen de reemplazo.
- [x] Se liberan las URLs de objeto (`URL.revokeObjectURL`) al destruir el componente.

### US-018 🔴 Tests de la capa de datos (3 pts)
- [x] Tests con `fake-indexeddb`: cache hit, cache miss, TTL vencido, error de red con y sin dato local.
- [x] Test de la cola: respeta la concurrencia y reintenta ante `429`.

---

## E2 — Pokédex (exploración)

### US-020 🔴 Lista paginada (3 pts)
- [x] Muestra nombre e imagen (sprite por id), 20 por página.
- [x] Paginación anterior/siguiente leyendo del índice local.
- [x] Usa `@for` con `track`.

### US-021 🔴 Búsqueda reactiva (3 pts)
- [x] Campo de búsqueda con `debounceTime`, `distinctUntilChanged` y `switchMap`.
- [x] Filtra contra el índice local; el término se refleja en la URL (query param).
- [x] Estado "sin resultados".

### US-022 🔴 Detalle del Pokémon (3 pts)
- [x] Ruta `/pokemon/:name` con *resolver* que usa el repositorio.
- [x] Muestra tipos, altura, peso y stats base.
- [x] Nombre inexistente redirige a 404.

### US-023 🔴 Estados de carga, vacío y error (2 pts)
- [x] Componente reutilizable con *skeleton*, mensaje de error y botón "Reintentar".

### US-024 🟡 Filtro por tipo (3 pts)
- [x] Selector de tipo que filtra la lista (combinable con la búsqueda).

---

## E3 — Equipo de 6 slots (Req. 2)

### US-030 🔴 Store del equipo (5 pts)
- [x] `TeamStore` con signals: 6 slots, cada uno `TeamSlot | null`.
- [x] `computed` para: slots libres, cantidad ocupada, equipo completo.
- [x] Estado expuesto como solo lectura; solo se modifica con métodos del store.
- [x] Tests de las reglas.

### US-031 🔴 Añadir y quitar Pokémon (3 pts)
- [x] Botón "Añadir al equipo" en lista y detalle; ocupa el primer slot libre.
- [x] Quitar desde la vista del equipo.
- [x] Si el equipo está completo, el botón queda deshabilitado con explicación.

### US-032 🔴 Reglas del equipo (2 pts)
- [x] Máximo 6.
- [x] No se permiten repetidos (regla configurable en una constante).
- [x] Mensajes claros cuando una acción se rechaza.

### US-033 🟡 Reordenar slots (3 pts)
- [x] Intercambiar posiciones con arrastrar y soltar (Angular CDK) **y** con botones accesibles por teclado.

### US-034 🔴 Persistencia del equipo (2 pts)
- [x] El equipo se guarda en IndexedDB en cada cambio (con `effect` o desde el store).
- [x] Al abrir la app se restaura, incluso sin conexión.
- [x] Si un dato del equipo no está en caché y no hay red, el slot se muestra con lo guardado y no se rompe.

### US-035 🟡 Resumen del equipo (3 pts)
- [x] Vista con tipos presentes, debilidades y resistencias del equipo (`computed`).

---

## E4 — Movimientos de cada Pokémon (Req. 3)

### US-040 🔴 Learnset del Pokémon (3 pts)
- [x] Se obtiene la lista de movimientos aprendibles desde el detalle guardado.
- [x] Los detalles de cada movimiento se piden **bajo demanda** (al abrir el selector) y se guardan en `moves`.
- [x] Se limita la concurrencia para no saturar la API (usa la cola de US-011).

### US-041 🔴 Selector de movimientos (5 pts)
- [x] Cada slot muestra sus 4 movimientos; se puede cambiar cualquiera.
- [x] Modal/panel con búsqueda por nombre y filtros por tipo y clase (física, especial, estado).
- [x] Cada opción muestra tipo, poder, precisión y PP.
- [x] Usa formulario reactivo.

### US-042 🔴 Validaciones de movimientos (2 pts)
- [x] Máximo 4, sin repetidos (validador personalizado).
- [x] Mínimo 1 movimiento de ataque para poder usar al Pokémon en batalla (aviso, no bloqueo en el equipo).

### US-043 🔴 Persistencia de movimientos (2 pts)
- [x] La selección se guarda con el slot y se restaura al recargar.

### US-044 🟡 Movimientos por defecto (2 pts)
- [x] Al añadir un Pokémon se asignan 4 movimientos de ataque por defecto (criterio: mayor poder entre los aprendibles; si los detalles no están descargados, se asignan al abrir el selector).

---

## E5 — Robustez offline y rendimiento

### US-050 🟡 "Descargar para uso sin conexión" (3 pts)
- [x] Botón que descarga y guarda detalles, sprites y movimientos del equipo actual.
- [x] Muestra progreso y resultado; es cancelable.

### US-051 🔴 Optimización (2 pts)
- [x] `OnPush` en todos los componentes, `track` en todos los `@for`.
- [x] `@defer` en secciones pesadas (resumen del equipo, selector de movimientos).

### US-052 🟡 Accesibilidad y auditoría (3 pts)
- [ ] Lighthouse: Accesibilidad y Buenas prácticas ≥ 90.
- [ ] Navegación completa con teclado y foco visible.

### US-053 🟢 Test E2E del flujo principal (3 pts)
- [ ] Buscar → añadir al equipo → cambiar un movimiento → recargar → el equipo sigue ahí.

> **Hito MVP (Req. 1, 2 y 3): E0 + E1 + E2 + E3 + E4 + E5.**

---

## E6 — Simulador de batalla 1 vs 1 (Req. 4 — opcional)

**Objetivo**: motor puro, determinista con semilla y fácil de testear; la UI es una capa encima.

### US-060 🟡 Cálculo de stats (3 pts)
- [x] Nivel fijo 50, sin IVs/EVs/naturaleza.
- [x] HP = `floor(2·base·L/100) + L + 10`; otros stats = `floor(2·base·L/100) + 5`.
- [x] Función pura con tests.

### US-061 🟡 Fórmula de daño simplificada (5 pts)
- [x] Daño base según nivel, poder, ataque/defensa (físico o especial según la clase del movimiento).
- [x] Modificadores: efectividad de tipos (×0, ×0.25, ×0.5, ×1, ×2, ×4), STAB ×1.5, crítico ×1.5 (probabilidad 1/24) y variación aleatoria 0.85–1.0.
- [x] Los movimientos de estado se ignoran en esta versión.
- [x] Cada resultado devuelve el desglose (qué modificadores se aplicaron) para mostrarlo en la UI.

### US-062 🟡 Entorno de batalla (3 pts)
- [x] Clima seleccionable: despejado, sol, lluvia.
- [x] Sol: Fuego ×1.5 y Agua ×0.5. Lluvia: Agua ×1.5 y Fuego ×0.5.
- [x] El modelo permite añadir más climas sin cambiar el motor.

### US-063 🟡 Resolución de turnos (5 pts)
- [x] Orden por velocidad (empate resuelto con RNG).
- [x] Verificación de precisión del movimiento.
- [x] Fin de batalla cuando un Pokémon llega a 0 HP.
- [x] RNG con semilla: misma semilla ⇒ mismo resultado.

### US-064 🟡 UI de configuración (3 pts)
- [x] Elegir dos Pokémon (de mi equipo o de la Pokédex), con sus movimientos y el clima.
- [x] Validación: ambos con al menos un movimiento de ataque.

### US-065 🟡 Desarrollo visual de la batalla (5 pts)
- [x] Barras de HP y registro de turnos ("Pikachu usó Rayo. ¡Es muy eficaz!").
- [x] Botones "Siguiente turno" y "Simular completa".
- [x] El registro muestra críticos y efectividad.

### US-066 🟡 Análisis de eficiencia (5 pts)
- [x] Tabla de matchup: daño esperado de cada movimiento contra el rival (sin aleatoriedad) y su efectividad.
- [x] Simulación de N batallas (por defecto 100) con porcentaje de victorias y turnos promedio para ganar.
- [x] Ejecutada en un `Web Worker` o por lotes para no bloquear la interfaz.

### US-067 🟡 Tests del motor (3 pts)
- [x] Casos conocidos: tipo inmune (×0), doble debilidad (×4), STAB, crítico, clima.
- [x] Test de determinismo con la misma semilla.

---

## E7 — Experimental: entrenadores y batalla por equipos (Req. 4.1)

### US-070 🟢 Entrenadores y múltiples equipos (5 pts)
- [ ] CRUD de entrenadores (nombre, avatar opcional).
- [ ] Cada entrenador tiene uno o más equipos de 6 slots (reutiliza `TeamStore` con `trainerId`).
- [ ] Migración: el equipo de E3 pasa a ser el del entrenador "Yo".

### US-071 🟢 Importar y exportar (3 pts)
- [ ] Exportar entrenador/equipo a JSON y volver a importarlo.
- [ ] Validación del esquema al importar, con mensajes claros si el archivo es inválido.
- [ ] Si faltan datos en caché, se descargan al importar (respetando la cola).

### US-072 🟢 Motor de batalla por equipos (5 pts)
- [ ] 6 vs 6: cuando un Pokémon se debilita entra el siguiente slot ocupado.
- [ ] Gana el entrenador que deja sin Pokémon al rival.
- [ ] Reutiliza el motor 1 vs 1 sin duplicar lógica.

### US-073 🟢 Decisión automática (3 pts)
- [ ] Cada turno el Pokémon elige el movimiento con mayor daño esperado.
- [ ] Estrategia aislada en una función intercambiable (para añadir otras luego).

### US-074 🟢 UI de batalla por equipos (5 pts)
- [ ] Seleccionar dos entrenadores y un equipo de cada uno.
- [ ] Muestra el Pokémon activo, HP, equipo restante y el registro.
- [ ] Resultado final con resumen: KOs por Pokémon y turnos totales.

### US-075 🟢 Torneo entre entrenadores (3 pts)
- [ ] Todos contra todos con tabla de posiciones.

---

## E8 — Entrega

### US-080 🔴 Publicación y documentación (3 pts)
- [ ] Despliegue (GitHub Pages, Netlify o Vercel).
- [ ] README con capturas, decisiones de arquitectura y cómo funciona la caché.
- [ ] Sección "Decisiones y trade-offs" (por qué IndexedDB, por qué signals, qué se dejó fuera).

---

## 5. Plan sugerido

| Fase | Contenido | Puntos aprox. | Resultado |
|---|---|---|---|
| 1 | E0 + E1 (US-010 a US-014, US-018) | 32 | Datos guardados y sin llamadas repetidas |
| 2 | E2 + resto de E1 | 28 | Pokédex funcional y offline para lo ya visto |
| 3 | E3 | 18 | Equipo de 6 con persistencia |
| 4 | E4 + E5 | 26 | **MVP** (Req. 1, 2 y 3) y despliegue |
| 5 | E6 | 32 | Simulador 1 vs 1 |
| 6 | E7 | 24 | Entrenadores y batalla por equipos |
| 7 | E8 | 3 | Pulido final |

**Orden de dependencias**: E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7. E6 necesita los tipos (US-014) y los movimientos (E4).

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Los movimientos requieren muchas llamadas | Descarga bajo demanda + cola con concurrencia limitada + caché permanente |
| IndexedDB no disponible o sin espacio | Modo en memoria con aviso (US-010) y gestión de almacenamiento (US-016) |
| Datos de la API que cambian | TTL y revalidación en segundo plano (US-012) |
| Sprites no disponibles sin conexión | Guardarlos como Blob (US-017) |
| El motor de batalla crece sin control | Funciones puras, semilla fija y tests antes de la UI (US-067) |
| Alcance excesivo | Los hitos MVP y E6 son independientes; E7 es opcional |

## 7. Fuera de alcance (por ahora)

- PWA con Service Worker (instalable y con *app shell* offline).
- Fórmula de daño oficial: niveles, IVs/EVs, naturalezas, movimientos de estado, objetos.
- Habilidades pasivas (*abilities*) y su efecto en batalla.
- Cuentas de usuario, sincronización entre dispositivos y multijugador.
- Cadenas de evolución.

## 8. Épicas futuras

- **F1 — Batalla fiel**: fórmula oficial, IVs/EVs, naturalezas, estados alterados, objetos.
- **F2 — Habilidades pasivas**: selección y efecto en combate.
- **F3 — PWA**: Service Worker, instalación y funcionamiento sin conexión desde la primera carga.
- **F4 — Backend opcional**: sincronización de equipos entre dispositivos.
