# Generar PRP

## Archivo de feature: $ARGUMENTS

Genera un PRP completo para implementar la feature descrita. Lee primero el archivo de feature para entender qué hay que construir, qué ejemplos aplican y qué restricciones hay.

El agente que ejecute el PRP solo tendrá el contexto que incluyas en él. Incluye snippets reales del codebase, no descripciones abstractas. El agente tiene acceso al código fuente y puede buscar en la web.

## Proceso de investigación

1. **Análisis del codebase**
   - Leer `PLANNING.md` para entender la arquitectura y los patrones vigentes
   - Leer `TASK.md` para entender el estado actual
   - Buscar features similares ya implementadas (adapter existente, use-case existente, screen existente)
   - Identificar archivos a referenciar en el PRP
   - Revisar los tests existentes para el patrón de testing a seguir

2. **Investigación externa** (si aplica)
   - Documentación de la API o librería
   - Ejemplos de implementación (GitHub, docs oficiales)
   - Bugs conocidos o quirks de versión

3. **Aclaración al usuario** (si hay ambigüedad)
   - ¿Qué patrón existente se quiere espejear?
   - ¿Hay integraciones específicas con otras capas?

## Generación del PRP

Usar `PRPs/templates/prp_base.md` como plantilla.

### Contexto crítico a incluir
- **Snippets de código reales** del codebase (no pseudocódigo abstracto)
- **Gotchas** específicos del stack (ver CLAUDE.md y PLANNING.md)
- **Archivos de referencia** con path exacto y por qué son relevantes
- **Patrón de error handling**: domain lanza, application/adapters devuelven Result<T,E>
- **Patrón de test**: TDD spec-first, Builders, Fakes inyectables, contratos de Port

### Puertas de validación (deben ser ejecutables)
```bash
# Nivel 1: Tipos y estilo
pnpm typecheck      # tsc --noEmit — debe pasar siempre
pnpm lint           # eslint --max-warnings=0 — frontera de capas

# Nivel 2: Tests
pnpm test           # vitest run — toda la suite
# O más específico:
pnpm test:domain
pnpm test:application
pnpm test:contracts
pnpm test:infrastructure

# Nivel 3: Cobertura (si se modifica domain/application)
pnpm test:coverage  # umbral 80% en domain + application
```

*** ANTES DE ESCRIBIR EL PRP, EXPLORAR EXHAUSTIVAMENTE EL CODEBASE Y PENSAR EN PROFUNDIDAD ***
*** ULTRATHINK: identificar todos los archivos que hay que tocar, los patrones a seguir, los gotchas a evitar ***

## Output
Guardar como: `PRPs/{nombre-feature}.md`

## Checklist de calidad
- [ ] Todo el contexto necesario incluido (snippets reales, no abstractos)
- [ ] Puertas de validación ejecutables por el agente
- [ ] Referencias a archivos existentes con path completo
- [ ] Ruta de implementación clara (capa por capa: domain → application → adapters → ui)
- [ ] Manejo de errores documentado (throw vs Result<T,E>)
- [ ] Patrón TDD explicado (RED → GREEN → REFACTOR)
- [ ] No viola la regla de dependencias de la arquitectura

Puntuar el PRP de 1-10 (confianza de éxito en un solo pase de implementación con Claude Code).

Objetivo: implementación exitosa en un solo pase gracias al contexto exhaustivo.
