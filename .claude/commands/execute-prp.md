# Ejecutar PRP

Implementa la feature usando el archivo PRP especificado.

## Archivo PRP: $ARGUMENTS

## Proceso de ejecución

1. **Cargar el PRP**
   - Leer el archivo PRP completo
   - Entender todos los requisitos y el contexto incluido
   - Seguir todas las instrucciones del PRP y ampliar la investigación si es necesario
   - Verificar que tienes todo el contexto para implementar completamente
   - Explorar más el codebase si hace falta

2. **ULTRATHINK**
   - Pensar en profundidad antes de empezar a codificar
   - Crear un plan de implementación completo (capa por capa: domain → application → adapters → ui)
   - Usar TaskCreate para trackear los pasos de implementación
   - Identificar los patrones existentes que hay que espejear (con path exacto)
   - Verificar que no se viola la regla de dependencias (infrastructure → adapters → application → domain)

3. **Flujo TDD (para cada capa)**
   ```
   RED   → escribir el test que falla
   GREEN → mínimo código para que pase
   REFACTOR → limpiar sin romper tests
   ```
   - Usar Test Data Builders para crear datos de prueba (`tests/builders/`)
   - Usar Fakes inyectables, no mocks (`tests/fakes/`)
   - Si se agrega un nuevo Port, crear su contrato en `tests/contracts/`

4. **Validar después de cada capa**
   ```bash
   pnpm typecheck   # debe pasar siempre
   pnpm lint        # frontera de capas — si falla, hay un import cruzado
   pnpm test        # toda la suite
   ```
   - Si falla: leer el error, entender la causa raíz, corregir el código, re-ejecutar
   - Nunca mockear para hacer pasar un test — corregir el código real

5. **Completar**
   - Verificar todos los ítems del checklist del PRP
   - Ejecutar la suite de validación final completa
   - Actualizar `TASK.md`: marcar completada + agregar sub-tareas descubiertas
   - Re-leer el PRP para asegurarse de que todo está implementado

6. **Referencia**
   - Se puede releer el PRP en cualquier momento durante la implementación

Nota: si una validación falla, usar los patrones de error del PRP para corregir y reintentar. No avanzar a la siguiente capa hasta que la actual tenga tests verdes.
