# PLANNING.md — Asistente IA Mobile

## Objetivo
App mobile de asistencia IA que integra múltiples agentes gratuitos. El usuario puede chatear, dictar por voz, adjuntar archivos/fotos, recibir respuestas de texto e imágenes/video generados por IA. Clean Architecture + TDD con Vitest desde el primer commit; React Native/Expo como capa de UI delgada sobre un núcleo TS puro.

## Tech Stack
| Capa | Tecnología |
|------|-----------|
| Lenguaje | TypeScript 5 (strict) |
| Package manager | pnpm (corepack, `node-linker=isolated`) |
| Tests | Vitest + @vitest/coverage-v8 |
| Mobile | React Native 0.81, Expo SDK 54 |
| UI runtime | Expo Go (iOS físico → fijo en SDK 54) |
| Navegación | @react-navigation/native-stack |
| Persistencia | expo-av / AsyncStorage |
| Audio | expo-audio |
| Cámara/galería | expo-image-picker |
| Documentos | expo-document-picker |
| Portapapeles | expo-clipboard |
| Fuentes | expo-font (Space Grotesk) |
| Blur | expo-blur |
| Gradientes | expo-linear-gradient |
| Validación schemas | Zod |
| Linting | ESLint flat config (no-restricted-imports entre capas) |
| Formato | Prettier |
| Build TS | tsc -p tsconfig.build.json → dist/ |

## Arquitectura (Clean Architecture)

```
src/
├── domain/          ← Entidades + Value Objects. Lógica pura, sin I/O.
│   └── [Conversation, Message, ...]
├── application/     ← Use Cases + Ports (interfaces). Orquesta el flujo.
│   ├── ports/       [AssistantAgentPort, ConversationRepositoryPort, ...]
│   └── use-cases/   [SendAssistantQuery, TranscribeAudio, ...]
├── adapters/        ← Implementaciones de Ports + UI.
│   ├── ai-agents/   [HuggingFaceAgentAdapter, OllamaLocalAgentAdapter, ...]
│   ├── persistence/ [AsyncStorageConversationRepo, InMemoryConversationRepo]
│   └── ui/          [screens/, components/, view-models/, navigation/, di/]
├── infrastructure/  ← Composition Root. Único lugar de instanciación concreta.
│   ├── config/env.ts      (único lector de process.env, valida con Zod)
│   └── di/container.ts    (crea el grafo de dependencias)
└── shared/          ← Transversal: Result<T,E>, errores tipados.
```

**Regla de dependencias** (hacia adentro): `infrastructure → adapters → application → domain`. Reforzada por ESLint (`no-restricted-imports` en `eslint.config.js`) — `pnpm lint` falla si se cruza una frontera.

## Patrones clave

### Constructor privado + factory estática (Domain)
```ts
class Conversation {
  private constructor(private readonly _id: string) {}
  static start(id: string, title?: string): Conversation { ... }
}
```

### Result<T,E> (Application + Adapters)
```ts
// Errores explícitos en la firma, sin throw en estos niveles
async ask(history: Message[]): Promise<Result<Message, AgentUnavailableError>>
```

### Ports + DI (Application)
```ts
// Port define el "qué" — el "cómo" lo implementa el adapter
interface AssistantAgentPort {
  ask(history: Message[]): Promise<Result<Message, AgentUnavailableError>>;
}
```

### View-models framework-agnostic (Adapters/UI)
```ts
// TS puro, testeable con Vitest sin renderizar
class ChatViewModel {
  getState(): ChatState { ... }
  subscribe(listener: () => void): () => void { ... }
  async send(text: string, imageUrl?: string): Promise<void> { ... }
}
// Hook React lo conecta con useSyncExternalStore
```

### Inyección de dependencias en el Container
```ts
// createContainer(env, storage, binaryUpload) — testeable en Node sin módulos nativos
const container = createContainer(loadEnv(expoEnvSource()), AsyncStorage, binaryUpload);
```

## AiAgentProvider
Union type: `'ollama' | 'huggingface' | 'flux' | 'krea' | 'hunyuan'`
- `createAssistantAgents(env, imageDownload)` → `Record<AiAgentProvider, AssistantAgentPort>` (exhaustivo)
- `RoutingAssistantAgent` enruta al proveedor activo; `select()` lo cambia en runtime
- `NotConfiguredAgent` devuelve error útil cuando el endpoint no está configurado (krea sin ngrok)

## Variables de entorno (todas `EXPO_PUBLIC_*` en runtime RN)
| Variable | Default | Uso |
|----------|---------|-----|
| `AI_AGENT_PROVIDER` | `ollama` | Proveedor activo |
| `AI_AGENT_BASE_URL` | `http://localhost:11434/api` | Ollama / base |
| `AI_AGENT_API_KEY` | — | Bearer token HF (requerido si provider es hf/flux/hunyuan) |
| `AI_AGENT_MODEL` | `llama3.2` | Modelo de chat |
| `AI_VIDEO_BASE_URL` | `https://router.huggingface.co/hf-inference/models` | Base Colab/ngrok para video |
| `AI_VIDEO_MODEL` | `generate` | Endpoint del modelo de video |
| `AI_HUNYUAN_BASE_URL` | `https://router.huggingface.co/fal-ai` | HunyuanVideo (fal-ai) |
| `AI_HUNYUAN_MODEL` | `hunyuan-video` | Slug del modelo |
| `AI_STT_BASE_URL` | `https://router.huggingface.co/hf-inference/models` | Whisper base |
| `AI_STT_MODEL` | `openai/whisper-large-v3` | Modelo STT |
| `AI_STT_API_KEY` | (cae al token del agente) | Key STT |

## Tests

```
tests/
├── domain/          ← Unitarios puros
├── application/     ← Aceptación con Fakes de los Ports
├── contracts/       ← *.contract.ts corre contra cada adaptador del Port
├── infrastructure/  ← Composition Root, env, container
├── adapters/        ← View-models (ChatViewModel, ConversationListViewModel, ...)
├── builders/        ← Test Data Builders (MessageBuilder, ConversationBuilder)
└── fakes/           ← Fakes reutilizables (FakeAssistantAgent, FakeStorage)
```

Glob Vitest: `tests/**/*.{spec,test,contract}.ts`
Umbral de cobertura: 80% en domain + application

## Features implementadas (estado 2026-06-29)
- Chat con texto (Ollama + HuggingFace)
- Transcripción de voz (Whisper via HF)
- Visión / imágenes multimodales (HF + fal-ai)
- Generación de imagen (FLUX)
- Generación de video (krea via Colab+ngrok, HunyuanVideo via fal-ai)
- Adjuntar archivos (texto inyectado al prompt, binarios por nombre)
- Cámara nativa (expo-image-picker)
- Historial de conversaciones (AsyncStorage)
- Renombrar / borrar conversaciones
- Pantalla de onboarding (3 pasos: bienvenida → elegir agente → listo)
- Drawer lateral con historial (translúcido, expo-blur)
- Animaciones: AnimatedBubble, PressableScale
- Agrupado de mensajes + separadores de fecha
- UI optimista (burbuja provisoria mientras responde la IA)
- Teclado / safe-area / FAB bajar al último mensaje
- Lightbox de imágenes
- Tema visual completo (tokens de color, tipografía, glow, radios)
- Fuente display (Space Grotesk, expo-font)
- Gradiente + AiBackdrop (orbes con View, sin react-native-svg)
