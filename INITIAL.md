## FEATURE:

[Describir la funcionalidad a implementar. Ser específico sobre el estado final deseado:
- ¿Qué hace el usuario?
- ¿Qué ve en pantalla?
- ¿Qué lógica de negocio involucra?]

## EXAMPLES:

[Si hay un archivo de referencia en el proyecto que muestre el patrón a seguir, indicarlo aquí.
Ejemplos útiles:
- "Seguir el mismo patrón que `HuggingFaceAgentAdapter` para el nuevo adapter"
- "La UI debe parecerse a la pantalla de onboarding (`OnboardingScreen.tsx`)"
- "El use-case debe funcionar como `RenameConversation`"]

## DOCUMENTATION:

[Documentación externa que se necesitará durante el desarrollo:
- URLs de APIs (HuggingFace, Expo, React Native, etc.)
- Secciones específicas de docs relevantes
- Links a ejemplos o issues de GitHub]

## OTHER CONSIDERATIONS:

[Restricciones específicas del proyecto que los asistentes de código suelen pasar por alto:

Arquitectura:
- La lógica va en view-models TS puros (Vitest), no en los .tsx
- Los .tsx solo renderizan — no contienen lógica de negocio
- Los adapters devuelven Result<T,E>, no lanzan (excepto el domain)
- Cualquier nuevo proveedor debe agregarse al union AiAgentProvider y al record exhaustivo de createAssistantAgents

Testing (TDD — spec-first):
- Escribir el test que falla ANTES del código
- Usar Test Data Builders (tests/builders/) para crear entidades, nunca construirlas a mano
- Los contratos de Port (tests/contracts/) deben correr contra TODOS los adapters del Port
- No mockear módulos; usar Fakes inyectables (tests/fakes/)

Expo / RN:
- SDK fijado en 54 — no instalar paquetes que requieran SDK 55+
- No usar react-native-svg (falla en web bajo Metro/pnpm)
- No usar Animated.event / Animated.FlatList (loop de rAF en web)
- Los config plugins van en app.json > plugins; expo-status-bar NO es plugin
- Env en runtime: EXPO_PUBLIC_* en .env.local (secretos) o .env (solo EXPO_PUBLIC_*)]
