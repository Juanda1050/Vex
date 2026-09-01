# Roadmap de refactor de Vex

Documento de seguimiento para estabilizar, asegurar y simplificar el proyecto.
Cada tarea debe marcarse solo después de ejecutar su validación asociada.

## Estado inicial

- [x] Auditar estructura, scripts y configuración.
- [x] Confirmar que el esquema Prisma es válido.
- [x] Confirmar paridad de las 829 claves entre `en` y `es`.
- [x] Inventariar 56 componentes para clasificación smart/dumb.
- [x] Detectar 88 archivos propios candidatos a camelCase.
- [x] Detectar 12 vulnerabilidades altas y 2 moderadas.
- [x] Detectar ausencia de pruebas automatizadas.
- [x] Conseguir que lint pase sin errores ni warnings.
- [x] Conseguir que typecheck pase.
- [x] Conseguir que build de producción pase.

## Reglas del refactor

- Archivos propios usan camelCase: `dashboardHeader.tsx`, `productService.ts`.
- Componentes, clases y tipos conservan PascalCase: `DashboardHeader`.
- Funciones, hooks y variables usan camelCase.
- No se renombran convenciones obligatorias de Next.js: `page.tsx`,
  `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`,
  `middleware.ts` o `proxy.ts`.
- No se renombran contratos de herramientas: `package-lock.json`,
  `next.config.ts`, `tsconfig.json`, `schema.prisma`, `migration.sql`,
  `.gitignore` y `copilot-instructions.md`.
- Se preservan grupos y segmentos dinámicos: `(protected)`, `(public)`, `[id]`
  y `[locale]`.
- No se crean carpetas `smart/` y `dumb/`.
- Subcomponentes privados permanecen en el mismo archivo cuando no son
  reutilizables ni tienen responsabilidad independiente.
- Cada lote debe pasar validación antes de iniciar el siguiente.
- No se mezclan cambios funcionales con renombres mecánicos.

## Fase 1: Línea base

- [x] Corregir `ignoreDeprecations` en `tsconfig.json`.
- [x] Resolver memoización incompatible con React Compiler.
- [x] Eliminar actualización de estado síncrona dentro del efecto detectado.
- [x] Eliminar imports sin uso.
- [x] Añadir script `typecheck`.
- [x] Añadir script de validación Prisma.
- [x] Resolver advertencia de configuración Prisma duplicada.
- [x] Resolver advertencia de módulo ESM de Tailwind.
- [x] Migrar convención `middleware.ts` a `proxy.ts` si aplica al stack actual.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run typecheck`.
- [x] Ejecutar `npm run build`.

**Criterio de salida:** lint, typecheck, Prisma validate y build pasan.

## Fase 2: Seguridad y dependencias

- [ ] Actualizar Next.js a una versión corregida compatible.
- [ ] Actualizar PostCSS, Sharp y Undici.
- [ ] Resolver dependencias transitivas vulnerables sin usar cambios forzados
      a ciegas.
- [ ] Revisar impacto de actualización sobre next-intl, Prisma y Supabase.
- [ ] Añadir Content Security Policy.
- [ ] Añadir headers `X-Content-Type-Options`, framing y referrer policy.
- [ ] Separar guards de páginas y guards de API.
- [ ] Devolver JSON `401` y `403` desde APIs, sin redirects HTML.
- [ ] Validar todos los parámetros de rutas dinámicas.
- [ ] Evitar mensajes internos en respuestas `500`.
- [ ] Revisar rate limiting para login, invitaciones, checkout y mutaciones.
- [ ] Revisar protección CSRF según uso real de cookies Supabase.
- [ ] Definir validación estricta de variables de entorno al iniciar y fallar de
      forma segura cuando falten secretos obligatorios.
- [ ] Aplicar mínimo privilegio a roles de aplicación, base de datos, Supabase
      y proveedores externos.
- [ ] Revisar cookies: `HttpOnly`, `Secure`, `SameSite`, expiración y rotación
      de sesión.
- [ ] Incorporar límites de tamaño para bodies, archivos, imágenes y campos de
      texto antes de procesarlos.
- [ ] Validar tipo real, extensión y tamaño de uploads; almacenar fuera de rutas
      ejecutables y servir mediante URLs controladas.
- [ ] Evitar enumeración de cuentas en login, recuperación e invitaciones.
- [ ] Sanitizar logs y telemetría para excluir tokens, cookies, contraseñas,
      datos de pago y datos personales innecesarios.
- [ ] Registrar eventos auditables de autenticación, permisos, cambios de rol,
      facturación, inventario y exportación de datos.
- [ ] Definir retención, acceso y protección de audit logs contra modificación.
- [ ] Configurar timeouts, reintentos acotados y circuit breaking donde existan
      integraciones externas.
- [ ] Documentar respuesta ante incidentes, rotación de secretos, backups y
      restauración probada.
- [ ] Ejecutar `npm audit --omit=dev`.
- [ ] Ejecutar lint, typecheck y build.

**Criterio de salida:** sin vulnerabilidades altas explotables conocidas y APIs
con respuestas de autenticación consistentes.

## Fase 3: Nombres camelCase

- [ ] Renombrar componentes propios con `git mv`.
- [ ] Renombrar hooks propios.
- [ ] Renombrar utilidades de `lib/`.
- [ ] Renombrar archivos propios de `server/`.
- [ ] Renombrar acciones: `forgotPasswordAction.ts`, por ejemplo.
- [ ] Renombrar esquemas: `productSchema.ts`, por ejemplo.
- [ ] Renombrar mensajes propios: `authShowcase.json`.
- [ ] Renombrar estilos propios: `accentThemes.css`.
- [ ] Renombrar seeds propios: `promoCodeSeed.ts`.
- [ ] Actualizar imports estáticos y dinámicos.
- [ ] Actualizar `.github/copilot-instructions.md` con la convención final.
- [ ] Confirmar que no quedan nombres propios en kebab-case.
- [ ] Ejecutar lint, typecheck y build por cada lote.

**Criterio de salida:** todos los archivos propios usan camelCase y las
excepciones contractuales están documentadas.

## Fase 4: Menos carpetas y archivos

- [ ] Eliminar `server/pos/constants/` si continúa vacío.
- [ ] Aplanar subcarpetas de un solo archivo en dominios CRUD.
- [ ] Mantener repositorio y servicio separados cuando sus responsabilidades
      sean distintas.
- [ ] Inferir tipos desde Zod cuando no sean contratos independientes.
- [ ] Unificar traductores de errores repetidos.
- [ ] Eliminar barrels internos que solo reexportan un archivo.
- [ ] Mantener un único API público por dominio cuando aporte encapsulación.
- [ ] Consolidar helpers pequeños que siempre cambian juntos.
- [ ] Revisar solapamiento entre `lib/`, `utils/` y helpers de dominio.
- [ ] Eliminar archivos `.DS_Store` versionados o residuales.
- [ ] Verificar que `.gitignore` continúe cubriendo `.DS_Store`.
- [ ] Actualizar todos los imports afectados.
- [ ] Ejecutar lint, typecheck y build por dominio migrado.

### Prácticas de servidor y modelo de negocio

- [ ] Definir por dominio sus casos de uso, invariantes y límites antes de
      consolidar archivos.
- [ ] Aplicar una dirección de dependencias simple: ruta o action → servicio →
      repositorio → Prisma.
- [ ] Mantener rutas y server actions delgadas: autenticar, validar, ejecutar un
      caso de uso y traducir su resultado a HTTP o estado de formulario.
- [ ] Mantener reglas, permisos contextuales y coordinación de operaciones en
      servicios de dominio.
- [ ] Limitar repositorios a persistencia y consultas; no incluir permisos,
      traducciones ni decisiones de negocio.
- [ ] Hacer que el servicio dueño del caso de uso controle la transacción
      completa cuando participen varios repositorios.
- [ ] Evitar que modelos o errores de Prisma salgan directamente de `server/`.
- [ ] Usar errores de dominio tipados con códigos estables y traducirlos una
      sola vez en el límite HTTP o action.
- [ ] Validar entradas externas con Zod e inferir tipos desde el esquema cuando
      no exista un contrato de dominio independiente.
- [ ] Obtener `tenantId`, `userId`, rol y permisos desde contexto autenticado;
      nunca confiar en esos campos enviados por cliente.
- [ ] Reemplazar clases singleton sin estado por funciones cuando no exista
      inyección de dependencias, estado interno o polimorfismo real.
- [ ] Evitar repositorios CRUD genéricos y abstracciones base que oculten
      consultas, permisos o invariantes importantes.
- [ ] Nombrar operaciones por intención de negocio, por ejemplo
      `convertQuoteToSale` en lugar de `updateStatus`.
- [ ] Centralizar infraestructura transversal como caché, paginación y
      observabilidad sin mover reglas de dominio a helpers globales.
- [ ] Invalidar caché después de confirmar la escritura o transacción.
- [ ] Eliminar caminos de negocio duplicados, servicios sin consumidores y
      modelos heredados solo después de verificar referencias y datos.
- [ ] Evitar dependencias circulares y acceso directo entre repositorios de
      dominios distintos; coordinar esos flujos desde un caso de uso dueño.
- [ ] Documentar API pública, invariantes y dependencias de cada dominio en su
      `index.ts` o documentación cercana.

Estructura objetivo para un dominio CRUD simple:

```text
server/products/
  productRepository.ts
  productService.ts
  productSchema.ts
  index.ts
```

**Criterio de salida:** menos navegación accidental y menos archivos
auxiliares, sin módulos gigantes ni mezcla de capas; rutas delgadas, reglas de
negocio explícitas y persistencia aislada detrás de cada dominio.

## Fase 5: Smart/dumb en todos los componentes

### Criterios globales

- [ ] Clasificar los 56 componentes como smart, dumb o primitiva UI.
- [ ] Documentar la clasificación durante la migración.
- [ ] Impedir `fetch`, router, acciones servidor y reglas de negocio en dumb.
- [ ] Pasar datos, labels y callbacks a componentes dumb mediante props.
- [ ] Mantener comportamiento interno de accesibilidad en primitivas UI.
- [ ] Mantener smart components en pages, screens, controllers o forms.
- [ ] Evitar crear un archivo para cada fragmento visual privado.
- [ ] Extraer componentes solo por responsabilidad, tamaño o reutilización real.

### Auth

- [ ] Separar estado y server actions de campos y layouts.
- [ ] Revisar login, registro e invitación.
- [ ] Reutilizar campos y estados visuales sin acoplar reglas de negocio.

### Dashboard y módulos compartidos

- [ ] Separar controlador y vista de dashboard toolbar.
- [ ] Separar navegación y filtros de tablas/paginación.
- [ ] Mantener cards, métricas, tablas y sparklines como dumb.
- [ ] Eliminar dependencias innecesarias de componentes hacia `server/`.

### Onboarding y suscripciones

- [ ] Separar controlador de checkout de sus secciones visuales.
- [ ] Separar flujo gratuito y flujo de pago.
- [ ] Unificar tarjeta visual de planes.
- [ ] Separar acciones de selección, cambio y pago de la presentación.
- [ ] Reducir `enhancedCheckoutForm` y su hook a responsabilidades claras.

### POS

- [ ] Extraer estado y llamadas API de `posScreen` a controlador o hook.
- [ ] Mantener carrito, filas, totales y controles como dumb.
- [ ] Modelar estados idle, loading, error y success explícitamente.

### Settings

- [ ] Dividir `settingsDashboard` por responsabilidades funcionales.
- [ ] Separar perfil, seguridad, empresa, equipo y suscripción.
- [ ] Compartir presentación de estados de guardado.
- [ ] Evitar duplicar manejo de avatar y formularios.

### Layout y UI

- [ ] Separar cálculo de navegación activa de su presentación.
- [ ] Revisar menú de usuario, navegación móvil y controles públicos.
- [ ] Confirmar que `components/ui/` no contiene lógica de dominio.
- [ ] Confirmar que primitivas reciben comportamiento por props.

**Criterio de salida:** los 56 componentes fueron revisados; toda lógica de
negocio tiene dueño explícito y las vistas son comprobables mediante props.

## Fase 6: Traducciones

- [ ] Conservar paridad total entre inglés y español.
- [ ] Revisar los 84-85 valores repetidos detectados.
- [ ] Mover a `common` solo estados, campos y errores universales.
- [ ] Mantener en dominio textos iguales con significado contextual distinto.
- [ ] Traducir el texto hardcodeado `Popular`.
- [ ] Eliminar defaults visibles en inglés dentro de componentes.
- [ ] Centralizar mensajes repetidos de payload inválido.
- [ ] Revisar textos visibles de rutas API y server actions.
- [ ] Crear verificación de claves ausentes entre locales.
- [ ] Crear verificación de claves sin uso.
- [ ] Crear reporte de duplicados sospechosos.
- [ ] Ejecutar verificaciones i18n en CI.

**Criterio de salida:** cero texto visible hardcodeado, paridad de locales y
duplicación común controlada.

## Fase 7: Dominio y escalabilidad

- [ ] Exigir `tenantId` en todas las consultas privadas.
- [ ] Añadir pruebas de aislamiento multi-tenant.
- [ ] Usar `Decimal` de forma consistente para dinero.
- [ ] Revisar transacciones de inventario, checkout y reembolsos.
- [ ] Garantizar idempotencia en checkout y pagos.
- [ ] Evitar stock negativo bajo concurrencia.
- [ ] Evitar reembolsos dobles.
- [ ] Proteger contadores de documentos contra carreras.
- [ ] Verificar límites de suscripción exclusivamente en servidor.
- [ ] Prohibir imports de repositorios desde componentes y rutas.
- [ ] Consumir dominios mediante su API pública.
- [ ] Revisar componentes mayores de 300 líneas.
- [ ] Revisar servicios o repositorios mayores de 400 líneas.
- [ ] Dividir por responsabilidad, no solo por cantidad de líneas.
- [ ] Definir ownership de datos y evitar que dos dominios escriban directamente
      las mismas entidades.
- [ ] Versionar contratos externos y diseñar migraciones compatibles hacia
      atrás cuando cambien APIs o eventos.
- [ ] Añadir correlación de requests y métricas por caso de uso sin registrar
      información sensible.
- [ ] Definir estrategia de backup, restauración y recuperación ante fallos para
      datos operativos y configuraciones.

**Criterio de salida:** invariantes críticas cubiertas y límites entre dominios
explícitos.

## Fase 8: Pruebas

- [ ] Elegir framework de pruebas unitarias e integración.
- [ ] Configurar Playwright para flujos E2E.
- [ ] Probar esquemas Zod y traducción de errores.
- [ ] Probar roles, permisos y guards.
- [ ] Probar servicios y repositorios críticos.
- [ ] Probar aislamiento multi-tenant.
- [ ] Probar inventario y concurrencia.
- [ ] Probar creación y conversión de cotizaciones.
- [ ] Probar checkout, idempotencia y reembolsos.
- [ ] Crear E2E de login, producto, inventario, cotización y venta.
- [ ] Añadir fixtures y factories sin datos sensibles.

**Criterio de salida:** flujos críticos tienen cobertura automatizada estable.

## Fase 9: UI, responsive mobile-first, accesibilidad y rendimiento

- [ ] Revisar estados loading, error, empty y success.
- [ ] Revisar navegación por teclado y manejo de foco.
- [ ] Revisar labels, nombres accesibles y mensajes de error.
- [ ] Revisar contraste en temas y acentos existentes.
- [ ] Diseñar primero desde el ancho mínimo soportado y añadir complejidad con
      `min-width`, evitando que desktop sea la fuente del layout móvil.
- [ ] Definir layout por espacio y capacidad disponible, no por modelos de
      dispositivo ni user-agent.
- [ ] Usar Grid/Flex, `minmax()`, `clamp()`, `aspect-ratio`, unidades relativas
      y container queries para componentes reutilizables.
- [ ] Evitar anchos, altos y posiciones rígidas salvo controles de formato fijo.
- [ ] Soportar contenido desde 280 px de ancho sin scroll horizontal global,
      texto cortado ni controles inaccesibles.
- [ ] Verificar móviles compactos, móviles estándar y móviles grandes en
      orientación vertical y horizontal.
- [ ] Verificar plegables en panel angosto, panel desplegado y cambios de
      postura sin perder estado ni ocultar acciones.
- [ ] Usar CSS de viewport segments y `env()` solo como mejora progresiva para
      bisagras o pliegues; mantener fallback funcional en navegadores comunes.
- [ ] Respetar safe areas con `env(safe-area-inset-*)` en navegación fija,
      modales, sheets y acciones inferiores.
- [ ] Verificar tablets compactas y grandes en ambas orientaciones, incluyendo
      split-screen y ventanas redimensionables.
- [ ] Verificar laptops de baja resolución y poca altura, evitando que headers
      sticky o modales bloqueen contenido y acciones.
- [ ] Verificar monitores Full HD, QHD, 4K y ultrawide mediante `max-width`,
      densidad útil y longitud de línea controlada; no estirar tablas o forms
      indefinidamente.
- [ ] Definir comportamiento responsive de tablas: scroll contenido, columnas
      prioritarias, vista apilada o detalle; nunca ocultar datos críticos sin
      alternativa.
- [ ] Garantizar objetivos táctiles de al menos 44 × 44 CSS px y separación
      suficiente, incluso con zoom y pantallas estrechas.
- [ ] Soportar teclado, mouse, touch y stylus sin depender exclusivamente de
      hover; usar media queries de `pointer` y `hover` cuando aporten valor.
- [ ] Probar zoom de navegador al 200 %, texto aumentado y reflow sin pérdida de
      contenido ni funcionalidad.
- [ ] Respetar `prefers-reduced-motion`, `prefers-contrast`, esquemas de color y
      ajustes de datos reducidos cuando estén disponibles.
- [ ] Revisar límites cliente/servidor y tamaño de bundles.
- [ ] Eliminar memoización manual innecesaria.
- [ ] Mantener paleta y tokens actuales del proyecto.
- [ ] Evitar JavaScript para layout cuando CSS pueda resolverlo.
- [ ] Reducir Client Components y enviar solo props serializables necesarias.
- [ ] Aplicar carga diferida a módulos, gráficos y medios fuera del viewport sin
      retrasar acciones principales.
- [ ] Optimizar imágenes con tamaños responsivos, formatos modernos, dimensiones
      declaradas y prioridad solo para contenido inicial crítico.
- [ ] Evitar fondos costosos, blur excesivo y `background-attachment: fixed` en
      equipos móviles o de baja potencia cuando afecten scroll y composición.
- [ ] Definir presupuestos por ruta para JavaScript, CSS, imágenes y fuentes.
- [ ] Medir Core Web Vitals por clase de dispositivo y conexión; fijar objetivos
      p75 de LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1.
- [ ] Probar throttling de CPU y redes lentas, caché fría y dispositivos con poca
      memoria.
- [ ] Evitar waterfalls: paralelizar lecturas independientes, paginar resultados
      y transmitir UI con Suspense donde mejore tiempo perceptual.
- [ ] Virtualizar listas únicamente cuando medición confirme que el volumen lo
      requiere; preservar accesibilidad y navegación.
- [ ] Configurar matriz Playwright visual y funcional para 320×568, 360×800,
      390×844, 412×915, 600×960, 768×1024, 1024×768, 1366×768, 1440×900,
      1920×1080 y 2560×1440.
- [ ] Añadir casos redimensionables de 280 px, orientación horizontal, viewport
      bajo, ultrawide y emulación plegable cuando el motor lo soporte.
- [ ] Ejecutar smoke tests visuales de vistas principales y comparar capturas
      para detectar overflow, solapamientos y regresiones.

**Criterio de salida:** flujos principales accesibles y mobile-first desde 280 px
hasta alta resolución, sin pérdida funcional, solapamientos ni presupuestos de
rendimiento incumplidos.

## Fase 10: Personalización por cuenta y usuario

### Alcance y precedencia

- [ ] Separar configuración de organización (`TenantSettings`) de preferencias
      personales (`UserProfile`) y estado local temporal del dispositivo.
- [ ] Definir precedencia explícita: preferencia de usuario → configuración de
      tenant → valor predeterminado seguro.
- [ ] Definir qué preferencias siguen al usuario entre dispositivos y cuáles
      permanecen locales por privacidad o ergonomía.
- [ ] Mantener personalización visual separada de permisos, precios, límites y
      demás reglas de negocio.

### Preferencias personales

- [ ] Ampliar perfil con locale, zona horaria, formato regional, tema, modo de
      contraste, densidad de interfaz y reducción de movimiento.
- [ ] Permitir preferencias de navegación, página inicial, almacén y sucursal
      predeterminados solo entre opciones autorizadas para el usuario.
- [ ] Permitir configuración de tablas por usuario: columnas visibles, orden,
      densidad, tamaño de página, filtros y vistas guardadas.
- [ ] Definir preferencias de notificación por canal y categoría, respetando
      mensajes transaccionales obligatorios.
- [ ] Sincronizar preferencias persistentes después de autenticar y evitar flash
      visual durante hidratación.
- [ ] Aplicar optimistically solo cambios reversibles y restaurar estado ante
      errores.
- [ ] Ofrecer restauración por sección y restauración total a valores
      predeterminados.

### Datos, seguridad y privacidad

- [ ] Crear esquema Zod y servicio específico para preferencias; no permitir
      actualizaciones arbitrarias del perfil.
- [ ] Autorizar lectura y escritura únicamente al usuario dueño, salvo acciones
      administrativas explícitas y auditadas.
- [ ] Evitar almacenar secretos, tokens, datos de pago o información sensible en
      preferencias, cookies o `localStorage`.
- [ ] Guardar en cookies solo preferencias tempranas mínimas, con tamaño,
      expiración y atributos de seguridad controlados.
- [ ] Aplicar migración/versionado del objeto de preferencias para incorporar
      nuevas opciones sin romper cuentas existentes.
- [ ] Registrar cambios sensibles de cuenta y permitir revisar sesiones activas,
      revocar dispositivos y cerrar todas las sesiones.
- [ ] Incluir exportación y eliminación de datos personales conforme a política
      de retención y obligaciones aplicables.
- [ ] Asegurar que branding del tenant no pueda producir contraste insuficiente,
      CSS arbitrario, URLs peligrosas ni suplantación de interfaz.

### Adaptabilidad y validación

- [ ] Mantener preferencias consistentes en móvil, plegable, tablet y desktop,
      adaptando densidad y navegación al espacio disponible.
- [ ] No sincronizar dimensiones de panel o layout que vuelvan inutilizable otro
      tipo de dispositivo; guardar variantes por clase de viewport cuando sea
      necesario.
- [ ] Probar concurrencia de cambios desde dos dispositivos y definir resolución
      mediante versión o `updatedAt`.
- [ ] Probar fallback para perfiles antiguos, preferencias inválidas y usuarios
      sin perfil creado.
- [ ] Probar aislamiento entre usuarios del mismo tenant y entre tenants.
- [ ] Medir impacto de carga de preferencias y cachear por usuario con
      invalidación precisa.
- [ ] Traducir labels, descripciones, confirmaciones y errores de preferencias.

**Criterio de salida:** cada usuario obtiene experiencia persistente, accesible y
segura entre dispositivos; preferencias no alteran permisos ni contaminan otras
cuentas y cuentan con fallback, migración y pruebas de aislamiento.

## Fase 11: CI y documentación

- [ ] Configurar CI con lint.
- [ ] Configurar CI con typecheck.
- [ ] Configurar CI con pruebas unitarias e integración.
- [ ] Configurar CI con Prisma validate.
- [ ] Configurar CI con build.
- [ ] Configurar CI con auditoría de dependencias.
- [ ] Configurar CI con validación i18n.
- [ ] Configurar CI con límites de bundle y presupuestos de rendimiento.
- [ ] Configurar pruebas responsive y visuales en viewports representativos.
- [ ] Ejecutar pruebas periódicas de restauración de backup y rotación de
      secretos en entornos no productivos.
- [ ] Actualizar README y preparación local.
- [ ] Documentar arquitectura por dominios.
- [ ] Documentar reglas smart/dumb.
- [ ] Documentar camelCase y excepciones contractuales.
- [ ] Documentar matriz responsive, presupuestos y dispositivos soportados.
- [ ] Documentar modelo y precedencia de preferencias por usuario y tenant.
- [ ] Documentar migraciones y variables de entorno.
- [ ] Ejecutar validación completa final.

**Criterio de salida:** cambios protegidos por automatización y documentación
vigente.

## Registro de avance

| Fecha      | Fase          | Lote              | Resultado      | Validación              |
| ---------- | ------------- | ----------------- | -------------- | ----------------------- |
| 2026-08-29 | Planificación | Auditoría inicial | Roadmap creado | Sin cambios funcionales |
| 2026-08-31 | Fase 2        | Auditoría NPM     | npm audit fix  | 11 vulnerabilidades resueltas (3 altas en deepmerge-ts requieren downgrade de Prisma) |
| 2026-08-31 | Fase 2        | Lote 1: Headers   | CSP + security headers en next.config.ts | lint, typecheck, build ✅ |
| 2026-08-31 | Fase 2        | Lote 1.1: Guards API | requireAuthApi, requirePermissionApi JSON 401/403 | lint, typecheck, build ✅ |
| 2026-08-31 | Fase 2        | Lote 1.2: Validación dinámica | UUID validation en [id] routes | lint, typecheck, build ✅ |
| 2026-08-31 | Fase 2        | Lote 2: Rate limit | checkRateLimit en-memoria, RATE_LIMIT_PRESETS, integración en registerAction | lint, typecheck, build ✅ |
| 2026-08-31 | Fase 2        | Lote 3: Log sanitization | logError/logWarn/logInfo sanitizers, integración register/promo-codes | lint, typecheck, build ✅ |
| 2026-08-31 | Fase 2        | Lote 4: Env validation | env-validator en next.config.ts, falla fatal en prod si faltan secrets | lint, typecheck, build ✅ |
| 2026-08-31 | Fase 2        | Riesgos conocidos | deepmerge-ts 3 altas: downgrade Prisma 6.12.0 vs 6.19.3 requiere testing (aplazado) | Documentado en roadmap |

## Definición de terminado

- [ ] Todas las fases cumplen su criterio de salida.
- [ ] Lint, typecheck, pruebas y build pasan en CI.
- [ ] Prisma validate pasa.
- [ ] Auditoría de seguridad no reporta riesgos altos aceptados sin documento.
- [ ] Inglés y español mantienen paridad.
- [ ] Todos los componentes fueron clasificados y ajustados.
- [ ] Archivos propios cumplen camelCase.
- [ ] Matriz responsive pasa desde 280 px hasta alta resolución.
- [ ] Core Web Vitals y presupuestos de recursos cumplen objetivos acordados.
- [ ] Preferencias personales están aisladas, versionadas y probadas.
- [ ] Backups y restauración fueron comprobados.
- [ ] Excepciones de framework y herramientas están documentadas.
- [ ] No existen cambios funcionales involuntarios conocidos.
