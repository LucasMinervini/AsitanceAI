/** Mapa de rutas del stack raiz y sus parametros (serializables). */
export type RootStackParamList = {
  Onboarding: undefined;
  Chat: { conversationId?: string } | undefined;
};
