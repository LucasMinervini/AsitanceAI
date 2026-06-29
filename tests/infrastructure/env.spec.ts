import { describe, it, expect } from 'vitest';
import { loadEnv } from '@infrastructure/config/env';

describe('loadEnv', () => {
  it('parsea variables de entorno validas', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.aiAgentBaseUrl).toBe('http://localhost:11434/api');
    expect(env.aiAgentModel).toBe('llama3.2');
  });

  it('usa el proveedor ollama por defecto', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.aiAgentProvider).toBe('ollama');
  });

  it('acepta el proveedor huggingface cuando hay API key', () => {
    const env = loadEnv({
      AI_AGENT_PROVIDER: 'huggingface',
      AI_AGENT_BASE_URL: 'https://router.huggingface.co/v1',
      AI_AGENT_MODEL: 'meta-llama/Llama-3.1-8B-Instruct',
      AI_AGENT_API_KEY: 'hf_token',
    });

    expect(env.aiAgentProvider).toBe('huggingface');
    expect(env.aiAgentApiKey).toBe('hf_token');
  });

  it('falla si el proveedor es huggingface y falta la API key', () => {
    expect(() =>
      loadEnv({
        AI_AGENT_PROVIDER: 'huggingface',
        AI_AGENT_BASE_URL: 'https://router.huggingface.co/v1',
        AI_AGENT_MODEL: 'meta-llama/Llama-3.1-8B-Instruct',
      }),
    ).toThrowError();
  });

  it('rechaza un proveedor desconocido', () => {
    expect(() =>
      loadEnv({
        AI_AGENT_PROVIDER: 'openai',
        AI_AGENT_BASE_URL: 'http://localhost:11434/api',
        AI_AGENT_MODEL: 'llama3.2',
      }),
    ).toThrowError();
  });

  it('deja la API key como opcional (agentes locales sin auth)', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.aiAgentApiKey).toBeUndefined();
  });

  it('falla rapido si falta la base url', () => {
    expect(() => loadEnv({ AI_AGENT_MODEL: 'llama3.2' })).toThrowError();
  });

  it('falla rapido si la base url no es una URL valida', () => {
    expect(() =>
      loadEnv({ AI_AGENT_BASE_URL: 'no-es-una-url', AI_AGENT_MODEL: 'llama3.2' }),
    ).toThrowError();
  });

  it('provee defaults de transcripción (Whisper en HuggingFace)', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.sttBaseUrl).toBe('https://router.huggingface.co/hf-inference/models');
    expect(env.sttModel).toBe('openai/whisper-large-v3');
    expect(env.sttApiKey).toBeUndefined();
  });

  it('toma la config de transcripción provista', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
      AI_STT_MODEL: 'openai/whisper-small',
      AI_STT_API_KEY: 'hf_token',
    });

    expect(env.sttModel).toBe('openai/whisper-small');
    expect(env.sttApiKey).toBe('hf_token');
  });

  it('acepta el proveedor flux cuando hay API key', () => {
    const env = loadEnv({
      AI_AGENT_PROVIDER: 'flux',
      AI_AGENT_BASE_URL: 'https://router.huggingface.co/hf-inference/models',
      AI_AGENT_MODEL: 'black-forest-labs/FLUX.1-schnell',
      AI_AGENT_API_KEY: 'hf_token',
    });

    expect(env.aiAgentProvider).toBe('flux');
  });

  it('provee defaults de generación de imágenes (FLUX en HuggingFace)', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.imageBaseUrl).toBe('https://router.huggingface.co/hf-inference/models');
    expect(env.imageModel).toBe('black-forest-labs/FLUX.1-schnell');
  });

  it('acepta el proveedor krea (video local vía Colab/ngrok)', () => {
    const env = loadEnv({
      AI_AGENT_PROVIDER: 'krea',
      AI_AGENT_BASE_URL: 'https://abc123.ngrok.io',
      AI_AGENT_MODEL: 'krea/krea-realtime-video',
      AI_AGENT_API_KEY: 'hf_token',
    });

    expect(env.aiAgentProvider).toBe('krea');
  });

  it('provee defaults de generación de video (krea vía HuggingFace)', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.videoBaseUrl).toBe('https://router.huggingface.co/hf-inference/models');
    expect(env.videoModel).toBe('krea/krea-realtime-video');
  });

  it('acepta el proveedor hunyuan cuando hay API key', () => {
    const env = loadEnv({
      AI_AGENT_PROVIDER: 'hunyuan',
      AI_AGENT_BASE_URL: 'https://router.huggingface.co/fal-ai',
      AI_AGENT_MODEL: 'hunyuan-video',
      AI_AGENT_API_KEY: 'hf_token',
    });

    expect(env.aiAgentProvider).toBe('hunyuan');
  });

  it('provee defaults de HunyuanVideo (fal-ai vía HuggingFace router)', () => {
    const env = loadEnv({
      AI_AGENT_BASE_URL: 'http://localhost:11434/api',
      AI_AGENT_MODEL: 'llama3.2',
    });

    expect(env.hunyuanBaseUrl).toBe('https://router.huggingface.co/fal-ai');
    expect(env.hunyuanModel).toBe('hunyuan-video');
  });
});
