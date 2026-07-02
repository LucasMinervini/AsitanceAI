# TASK.md

## En progreso
_(ninguna tarea abierta en este momento)_

## Completado (esta sesión)
- [x] Pulido MVP de Ajustes: validación de URL de Ollama en el VM (exige esquema http(s); rechaza antes de persistir) + red de seguridad anti-brick en la pantalla de error de `App.tsx` (botón "Borrar ajustes guardados y reintentar")
- [x] Sprint 2 (FLUX): persistir imagen generada (rol assistant) en AsyncStorage — la imagen de vision (user) sigue siendo transitoria por bloat — + texto de espera según categoría del agente ("🎨 Generando imagen…" / "🎬 Generando video…")
- [x] Búsqueda en historial del drawer: módulo puro `filterConversations` (case/acento-insensible, full-text vía `searchText` = título + todos los mensajes) + barra de búsqueda en el `HistoryDrawer`
- [x] Multi-conversación Fase A (selector rápido): módulo puro `buildConversationTabs` + componente `ConversationTabs` (tira de chips arriba del chat, activo resaltado + chip ＋). Fase B (registry de VMs / concurrencia en vivo) queda como follow-up
- [x] Fix UI: empty state scrolleable (no pisa el input con el teclado abierto) + badge del selector muestra el modelo del agente ACTIVO (antes mostraba siempre el de chat aun con FLUX/Hunyuan)
- [x] Exportar conversación: módulo puro `formatConversationAsText` + `ChatViewModel.exportText()`/`hasMessages` + botón 📤 en el header (Share nativo de RN, sin expo-sharing)
- [x] Multi-conversación Fase B: `ChatViewModelRegistry` (VMs vivos por id, estado en vivo al volver; envíos en segundo plano siguen) + wire en DI/`useChatViewModel` + evict al borrar
- [x] Pulido UI: sugerencias del empty state adaptadas a la categoría del agente activo (`suggestionsFor`: imagen/video/chat) + `AgentSelector.onChange` → `ChatView` reacciona en vivo al cambiar de agente
- [x] Pulido UI: fondo unificado (`ScreenBackground` = gradiente + `AiBackdrop`) en Onboarding y Ajustes, para cohesión con el Chat

## Pendiente / Backlog
- [ ] URL correcta para HunyuanVideo via fal-ai (slug desconocido — necesita debug con InferenceClient en Colab con HF_TOKEN)
- [x] Pantalla de ajustes (editar API key + URL de Ollama, persiste en AsyncStorage, reinicia el container)
- [x] Búsqueda en historial del drawer (filtrar conversaciones por texto)
- [x] Soporte multi-conversación: selector rápido (Fase A). Falta Fase B (concurrencia en vivo con registry de ChatViewModels) — opcional
- [x] Multi-conversación Fase B: registry de ChatViewModels vivos (`ChatViewModelRegistry`) — al volver a una charla se ve su estado en vivo (incluido un envío en vuelo) en vez de reconstruir desde el repo; los envíos en segundo plano siguen actualizando su VM
- [x] Exportar conversación (Share nativo de RN — texto plano; no se usó expo-sharing para no sumar dep nativa)

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
