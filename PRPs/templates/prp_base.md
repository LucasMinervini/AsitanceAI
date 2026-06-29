---
name: "PRP Base — Asistente IA Mobile"
description: |

## Propósito
Template para implementar features con contexto suficiente para que el agente se autovalidee e itere hasta tener código funcionando.

## Principios
1. **El contexto es rey**: incluir snippets reales del codebase, no descripciones abstractas
2. **Puertas de validación ejecutables**: comandos que el agente puede correr y corregir
3. **Denso en información**: usar patrones y keywords del codebase real
4. **Progresión por capas**: domain → application → adapters → ui
5. **Reglas globales**: seguir CLAUDE.md y PLANNING.md en todo momento

---

## Objetivo
[Qué hay que construir — ser específico sobre el estado final]

## Por qué
- [Valor para el usuario]
- [Integración con features existentes]
- [Problemas que resuelve]

## Qué
[Comportamiento visible por el usuario y requisitos técnicos]

### Criterios de éxito
- [ ] [Resultado específico y medible]

---

## Todo el contexto necesario

### Documentación y referencias
```yaml
# LEER ANTES DE IMPLEMENTAR

- file: src/domain/[EntidadSimilar].ts
  why: Patrón constructor privado + factory estática a seguir

- file: src/application/use-cases/[UseCaseSimilar].ts
  why: Patrón de orquestación + inyección de Port

- file: src/adapters/ai-agents/[AdapterSimilar].ts
  why: Patrón de adapter con Result<T,E> y Zod

- file: tests/[capa]/[TestSimilar].spec.ts
  why: Patrón de test TDD con Builders y Fakes

- file: tests/contracts/[Port].contract.ts
  why: Cómo se define un contrato de Port (si aplica)

- url: [URL docs oficiales de la API o librería]
  why: [Secciones específicas relevantes]
```

### Árbol del codebase actual (relevante)
```
src/
├── domain/
│   └── [archivos existentes relevantes]
├── application/
│   ├── ports/[Port relevante].ts
│   └── use-cases/[UseCase relevante].ts
├── adapters/
│   ├── ai-agents/[adapter relevante].ts
│   └── ui/[componente/view-model relevante]
└── infrastructure/
    └── di/container.ts
```

### Árbol deseado (archivos a crear/modificar)
```
src/
├── domain/
│   └── [NewEntity].ts                    ← nueva entidad (si aplica)
├── application/
│   ├── ports/[NewPort].ts                ← nuevo Port (si aplica)
│   └── use-cases/[NewUseCase].ts         ← nuevo use-case
├── adapters/
│   └── ai-agents/[NewAdapter].ts         ← nuevo adapter
└── infrastructure/
    └── di/container.ts                   ← cablear en container

tests/
├── domain/[NewEntity].spec.ts
├── application/[NewUseCase].spec.ts
├── contracts/[NewPort].contract.ts       ← si hay nuevo Port
└── adapters/[view-model o adapter].spec.ts
```

### Gotchas del codebase y del stack
```ts
// ARQUITECTURA
// - domain LANZA (throw DomainError) para violar invariantes
// - application y adapters DEVUELVEN Result<T,E> — NUNCA lanzan
// - importar de domain desde application está bien; al revés NO
// - infrastructure es el único lugar donde se instancian clases concretas

// TESTING
// - SIEMPRE usar Builders: MessageBuilder.aMessage().withText('hola').build()
// - NUNCA construir entidades directamente en los tests
// - Los Fakes son stateful y reutilizables; los Mocks no se usan
// - Los contratos de Port se ejecutan contra TODOS los adapters del Port

// EXPO / RN
// - NO react-native-svg (falla en web)
// - NO Animated.event / Animated.FlatList (loop rAF en web)
// - SDK fijado en 54 — no instalar paquetes que requieran SDK 55+
// - Alias de imports (@domain/*, @application/*, etc.) definidos en tsconfig.json

// VIEW MODELS
// - TS puro, sin imports de React — testeable con Vitest sin renderizar
// - getState() + subscribe() → hook lo conecta con useSyncExternalStore
// - Los .tsx solo renderizan, no contienen lógica de negocio
```

---

## Blueprint de implementación

### Modelos de datos
```ts
// Nuevos tipos / entidades / DTOs necesarios
// Incluir validaciones Zod si hay DTO de persistencia o HTTP
```

### Tareas en orden de implementación

```yaml
Tarea 1 — Domain (si aplica):
CREAR src/domain/[NewEntity].ts:
  - Constructor privado + factory estática
  - Validación en construcción → lanza DomainError si inválido
  - Métodos devuelven nueva instancia (inmutabilidad)
  - ESPEJEAR patrón de: src/domain/Conversation.ts

CREAR tests/domain/[NewEntity].spec.ts:
  - Test happy path con Builder
  - Test invariante rota (expect(() => ...).toThrow(DomainError))
  - ESPEJEAR patrón de: tests/domain/Conversation.spec.ts

Tarea 2 — Port (si aplica):
CREAR src/application/ports/[NewPort].ts:
  - Interface con métodos async que devuelven Result<T,E>
  - Importar solo del dominio

CREAR tests/contracts/[NewPort].contract.ts:
  - Define la función de contrato + la invoca con la factory de cada adapter
  - El archivo debe contener describe, no solo exportar
  - ESPEJEAR patrón de: tests/contracts/AssistantAgentPort.contract.ts

Tarea 3 — Use Case:
CREAR src/application/use-cases/[NewUseCase].ts:
  - Constructor recibe Port(s) por parámetro (DIP)
  - Método execute() orquesta: validar → llamar Port → mapear resultado
  - Devuelve Result<T,E>

CREAR tests/application/[NewUseCase].spec.ts:
  - Usar Fake del Port (de tests/fakes/ o crear uno inline)
  - Happy path + error case
  - ESPEJEAR patrón de: tests/application/SendAssistantQuery.spec.ts

Tarea 4 — Adapter:
CREAR src/adapters/[categoria]/[NewAdapter].ts:
  - Implementa el Port
  - Valida response con Zod → traduce errores a tipos de shared/errors/
  - Devuelve Result<T,E>

Tarea 5 — Cablear en container:
MODIFICAR src/infrastructure/di/container.ts:
  - Instanciar el nuevo adapter
  - Instanciar el nuevo use-case con el adapter
  - Exponer en la interfaz Container / UiDependencies si lo usa la UI

Tarea 6 — UI (si aplica):
MODIFICAR src/adapters/ui/view-models/[ViewModel].ts:
  - Agregar método o estado para la nueva feature
  - TS puro, sin imports de React

MODIFICAR src/adapters/[...]/[Screen o Component].tsx:
  - Renderizar el nuevo estado del view-model
  - Llamar al método nuevo en el event handler

Tarea N — Env (si hay nueva variable):
MODIFICAR src/infrastructure/config/env.ts:
  - Agregar campo al schema Zod
  - Agregar a EnvConfig
  - Agregar a expoEnvSource() con EXPO_PUBLIC_* prefix
  - Agregar validación en superRefine si es requerida condicionalmente
```

### Pseudocódigo detallado por tarea

```ts
// Tarea 1 — NewEntity
class NewEntity {
  private constructor(
    readonly id: string,
    readonly value: string,  // inmutable
  ) {}

  static create(id: string, value: string): NewEntity {
    if (!value.trim()) throw new NewEntityInvalidError('value cannot be empty');
    return new NewEntity(id, value);
  }

  withUpdatedValue(newValue: string): NewEntity {
    // Devuelve copia — nunca muta
    return NewEntity.create(this.id, newValue);
  }
}

// Tarea 3 — NewUseCase
class NewUseCase {
  constructor(
    private readonly repo: ConversationRepositoryPort,
    private readonly newPort: NewPort,
  ) {}

  async execute(input: NewUseCaseInput): Promise<Result<NewUseCaseOutput, NewUseCaseError>> {
    const found = await this.repo.findById(input.conversationId);
    if (!found) return err(new ConversationNotFoundError(input.conversationId));

    const result = await this.newPort.doSomething(found);
    if (result.isErr()) return err(new NewUseCaseError(result.error.message));

    return ok({ output: result.value });
  }
}
```

### Puntos de integración
```yaml
ENV:
  - agregar en: src/infrastructure/config/env.ts
  - patrón: campo Zod con .default('valor') y key EXPO_PUBLIC_*

CONTAINER:
  - agregar en: src/infrastructure/di/container.ts
  - patrón: instanciar adapter → instanciar use-case → exponer en interfaz

UI_DEPENDENCIES:
  - agregar en: src/adapters/ui/di/DependenciesContext.tsx
  - solo si la UI necesita el nuevo use-case directamente

AGENT_PROVIDER (si es nuevo provider de IA):
  - agregar al union AiAgentProvider en: src/infrastructure/config/env.ts
  - agregar entrada en: src/infrastructure/di/createAssistantAgents.ts (record exhaustivo)
  - agregar metadatos en: src/adapters/ui/components/AgentSelector.tsx (AGENT_META)
```

---

## Puertas de validación

### Nivel 1: Tipos y estilo
```bash
pnpm typecheck    # tsc --noEmit — debe pasar antes de continuar
pnpm lint         # eslint --max-warnings=0 — si falla, hay import cruzado entre capas
```

### Nivel 2: Tests unitarios
```ts
// Crear tests/[capa]/[Feature].spec.ts:
it('happy path — [descripción]', () => {
  const entity = NewEntityBuilder.aNewEntity().withValue('válido').build();
  expect(entity.value).toBe('válido');
});

it('invariante rota — [descripción]', () => {
  expect(() => NewEntity.create('id', '')).toThrow(NewEntityInvalidError);
});

it('use-case — error del Port se propaga como Result.err', async () => {
  const useCase = new NewUseCase(fakeRepo, FakeNewPort.thatFails());
  const result = await useCase.execute({ conversationId: 'x' });
  expect(result.isErr()).toBe(true);
});
```

```bash
# Correr y iterar hasta que pasen:
pnpm test:domain
pnpm test:application
pnpm test:contracts
# Si falla: leer el error, entender la causa raíz, corregir el código, re-ejecutar
# NUNCA mockear para hacer pasar — corregir el código real
```

### Nivel 3: Suite completa
```bash
pnpm test           # toda la suite — no debe romper tests existentes
pnpm test:coverage  # si se tocó domain/application — mantener umbral 80%
```

---

## Checklist final de validación
- [ ] Todos los tests pasan: `pnpm test`
- [ ] Sin errores de tipo: `pnpm typecheck`
- [ ] Sin errores de lint: `pnpm lint`
- [ ] Cobertura ≥ 80% en domain/application: `pnpm test:coverage`
- [ ] Los contratos de Port corren contra todos los adapters
- [ ] No se viola la regla de dependencias (domain no importa de application, etc.)
- [ ] Los errores se manejan con los tipos correctos (DomainError vs Result<T,E>)
- [ ] `TASK.md` actualizado (tarea marcada completa + sub-tareas descubiertas)

---

## Anti-patrones a evitar
- No crear abstracciones nuevas cuando ya existe un patrón en el codebase
- No mockear módulos — usar Fakes inyectables
- No construir entidades directamente en tests — usar Builders
- No importar desde infrastructure en adapters o application
- No poner lógica de negocio en los .tsx — va en el view-model
- No ignorar tests en rojo — corregir el código real
- No usar `any` — tipar todo con TypeScript strict
- No usar sync donde se espera async (los Ports son todos async)
- No hardcodear valores que deberían venir de env.ts
