# TASK.md

## En progreso
_(ninguna tarea abierta en este momento)_

## Pendiente / Backlog
- [ ] URL correcta para HunyuanVideo via fal-ai (slug desconocido — necesita debug con InferenceClient en Colab con HF_TOKEN)
- [ ] Pantalla de ajustes (editar tokens, endpoints, modelo activo)
- [ ] Búsqueda en historial del drawer (filtrar conversaciones por texto)
- [ ] Soporte multi-conversación simultánea (pestañas o selector rápido)
- [ ] Exportar conversación (share vía expo-sharing)

## Descubierto durante el trabajo
_(agregar aquí sub-tareas o TODOs encontrados durante la implementación)_

---

## Completado

### Dominio + Application core
- [x] Entidades: `Message`, `Conversation` (constructor privado + factory, inmutables)
- [x] Ports: `AssistantAgentPort`, `ConversationRepositoryPort`, `TranscriptionPort`
- [x] Use cases: `SendAssistantQuery`, `CreateConversation`, `DeleteConversation`, `ListConversations`, `RenameConversation`, `TranscribeAudio`
- [x] `Result<T,E>` + jerarquía de errores tipados (`DomainError`, `AgentUnavailableError`, `ConversationClosedError`, `TranscriptionUnavailableError`)

### Adapters de IA
- [x] `OllamaLocalAgentAdapter` (local, sin auth)
- [x] `HuggingFaceAgentAdapter` (Bearer token, OpenAI-compatible)
- [x] `HuggingFaceImageAdapter` (imagen/video via HF serverless o ngrok)
- [x] `HuggingFaceTranscriptionAdapter` (Whisper, `BinaryUpload` inyectable)
- [x] `RoutingAssistantAgent` + `createAssistantAgents` (record exhaustivo por provider)
- [x] `NotConfiguredAgent` (error útil cuando el endpoint no está configurado)
- [x] Soporte multimodal (content array OpenAI-compatible con `image_url`)

### Persistencia
- [x] `InMemoryConversationRepo` (tests)
- [x] `AsyncStorageConversationRepo` (DTO Zod, `KeyValueStorage` inyectable)
- [x] Contratos de persistencia (`ConversationRepositoryPort.contract.ts`)

### UI
- [x] `ChatViewModel` (store framework-agnostic, envío optimista)
- [x] `ConversationListViewModel` (lista + crear + borrar + renombrar)
- [x] `buildChatRows` (agrupado por sender, separadores de fecha — puro y testeado)
- [x] `ChatScreen` + `ChatView` (lista, inputRow, KeyboardAvoidingView, safe-area)
- [x] `AnimatedBubble` (fade + slide-up + scale, one-shot)
- [x] `PressableScale` (spring al presionar, reutilizable)
- [x] `HistoryDrawer` (overlay translúcido, expo-blur, renombrar/borrar)
- [x] `AgentSelector` (chips, metadatos de agente con ícono/categoría)
- [x] `AiBackdrop` (orbes con View, gradiente expo-linear-gradient)
- [x] FAB ↓ (bajar al último mensaje)
- [x] Lightbox de imágenes (Modal transparente)
- [x] Input iluminado al enfocar
- [x] Adjuntos: chip sobre input, texto inyectado al prompt, binarios por nombre
- [x] Cámara (expo-image-picker, data URL, mismo chip de adjuntos)
- [x] Notas de voz (expo-audio → Whisper → send directo)
- [x] Visión: imagen como data URL, burbuja con thumbnail, `imageUrl` en `Message`
- [x] `composeAttachmentMessage` (combina texto + adjunto, testeado)

### Infraestructura
- [x] `config/env.ts` (único lector de process.env, validación Zod, defaults por provider)
- [x] `di/container.ts` (Composition Root, `createContainer(env, storage, binaryUpload)`)
- [x] `DependenciesProvider` / `useDependencies` (DI en UI sin importar infrastructure)
- [x] `RootNavigator` (detecta onboarding completo, decide ruta inicial)
- [x] `OnboardingScreen` (3 pasos: bienvenida → elegir agente → done)
- [x] Onboarding persistence (`storage.getItem/setItem('onboarding:done')`)
- [x] `expoEnvSource()` (lee `EXPO_PUBLIC_*` inyectadas por Babel)
- [x] `App.tsx` (try/catch en creación del container, muestra "Error de configuración")

### Cobertura de tests
- [x] 105+ tests — domain, application, contracts, infrastructure, adapters (view-models)
- [x] Umbral cobertura 80% en domain + application
- [x] `pnpm typecheck` verde
- [x] `pnpm lint` verde
