## FEATURE:

Integración multimodal **agnóstica al proveedor**: sumar **Text-to-Video**, **Text-to-Speech (TTS)** e **Image-to-Text** al núcleo, con un **Port por capacidad** y un **Adapter por (modelo × proveedor)**. El dominio y los use-cases no deben saber si el video lo genera Wan-AI, Hunyuan o AnimateDiff.

**Primer slice (este PRP): Text-to-Video.**
- El usuario pide un video por texto (prompt) desde el chat.
- Ve una burbuja "🎬 Generando video…" (ya existe el label por categoría) y, al terminar, el video como entregable.
- Lógica: un use-case `GenerateVideo` recibe un `VideoGenerator` (Port) y devuelve `Result<GeneratedVideo, VideoUnavailableError>`. Un `RoutingVideoGenerator` (a futuro) enruta al modelo activo en runtime, igual que `RoutingAssistantAgent`.

**Capacidades objetivo (slices siguientes):**
- Video: `Wan-AI/Wan2.1-T2V-1.3B` (ligero, primer slice), `HunyuanVideo-1.5` (migrar el adapter actual al Port nuevo), `AnimateDiff-Lightning` (rápido), luego `Mochi-1` / `SulphurAI` vía el contrato.
- TTS: `SpeechSynthesizer` (Groq PlayAI / Kokoro-82M vía HF router).
- Image-to-Text: `ImageAnalyzer` (BLIP / Qwen-VL) — caption y VQA.

## EXAMPLES:

- **Port**: seguir `application/ports/TranscriptionPort.ts` (interface + tipo de entrada inline, devuelve `Result<T, E>`).
- **Adapter**: seguir `adapters/ai-agents/HuggingFaceImageAdapter.ts` (mapea DTO crudo, valida con Zod, traduce fallos a error tipado con status + snippet del cuerpo).
- **Transporte inyectable**: seguir `adapters/ai-agents/http.ts` (`ImageDownload` / `BinaryUpload`) → definir `VideoInference` (POST → poll → URL del video), impl real en `App.tsx`, fake en tests.
- **Contrato**: seguir `tests/contracts/AssistantAgentPort.contract.ts` (escenarios `replies | transportDown | providerError | malformed`, se corre contra cada adapter).
- **Fake**: seguir `tests/fakes/FakeAssistantAgent.ts` (factories `thatReturns(...)` / `thatIsUnavailable()`).
- **Use-case**: seguir `application/use-cases/TranscribeAudio.ts` (recibe el Port por constructor, delega).
- **Routing**: seguir `adapters/ai-agents/RoutingAssistantAgent.ts` + `infrastructure/di/createAssistantAgents.ts` (record exhaustivo por modelo).

## DOCUMENTATION:

- HF Inference Providers (router): `https://router.huggingface.co/<provider>/...` — Krea/Hunyuan/Wan van por **fal-ai** con el token HF. Doc: https://huggingface.co/docs/inference-providers
- fal-ai video (async: encolar → poll → URL del .mp4).
- Groq (TTS PlayAI + Whisper STT): https://console.groq.com/docs
- Modelos: `Wan-AI/Wan2.1-T2V-1.3B`, `tencent/HunyuanVideo`, `ByteDance/AnimateDiff-Lightning`.
- Reproducción de video en RN: requiere `expo-video` (NO instalado aún — es un slice de UI aparte; el core no lo necesita).

## OTHER CONSIDERATIONS:

Arquitectura:
- **Un Port por capacidad** (`VideoGenerator`, `SpeechSynthesizer`, `ImageAnalyzer`), **un Adapter por modelo**. El Port expresa el *qué*; el provider↔modelo vive solo en `config/env.ts` + el Router.
- Los adapters devuelven `Result<T,E>`, no lanzan. Error tipado por capacidad (`VideoUnavailableError` extiende `DomainError`), con **status + snippet** del cuerpo para diagnóstico.
- Salidas multimodales como **Value Objects** planos y serializables (`GeneratedVideo { url, mimeType, durationSeconds? }`). La URL puede ser remota temporal o data URL.
- **Persistencia:** video/audio **NO** como base64 en AsyncStorage (revienta la cuota, ya pasó con imágenes) → persistir **solo la URL/uri**, no los bytes.
- **⚠️ GGUF en Ollama: solo para chat (LLM texto).** Ollama NO corre difusión de video; "LTX/Wan GGUF local" necesita un runtime tipo ComfyUI → dejar el Port runtime-agnóstico y marcar local-video como experimental (NO usar el adapter de Ollama para video).
- **Inference Providers de pago:** fal-ai/Groq cobran más allá del crédito free de HF (da 401/402). Sin key/billing válido → `NotConfiguredAgent` (patrón existente), nunca romper el arranque.

Testing (TDD — spec-first):
- Escribir el test que falla ANTES del código.
- **Contract test** `VideoGeneratorPort.contract.ts`: cualquier nuevo modelo de video (Wan, Hunyuan, AnimateDiff, Mochi, Sulphur) debe pasar el MISMO contrato → garantiza el formato de salida que espera la UI (`mimeType` empieza con `video/`, `url` no vacía). Agregar un adapter = una línea al final del contrato.
- **Fakes inyectables** (`FakeVideoGenerator`) con factories por escenario para desarrollar la UI sin llamadas reales.
- Test Data Builders para los Value Objects de salida (`GeneratedVideoBuilder`).
- Env: `loadEnv` con provider que necesita key pero sin ella → debe fallar (superRefine), como ya hace con `AI_AGENT_API_KEY`.

Expo / RN:
- SDK 54, no react-native-svg, no `Animated.event`/`Animated.FlatList`.
- La reproducción de video (`expo-video`) es un slice de UI posterior; este PRP entrega el **core** (domain → application → adapter → contrato → fake), sin tocar la UI.
