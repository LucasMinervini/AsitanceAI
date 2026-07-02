import { Message, type MessageRole } from '@domain/entities/Message';

/**
 * Test Data Builder: crea Messages validos con valores por defecto,
 * sobreescribiendo solo lo relevante para cada test (legibilidad).
 *   MessageBuilder.aMessage().withRole('assistant').withText('Hola').build()
 */
export class MessageBuilder {
  private role: MessageRole = 'user';
  private text = 'mensaje de prueba';
  private imageUrl: string | undefined = undefined;
  private videoUrl: string | undefined = undefined;

  static aMessage(): MessageBuilder {
    return new MessageBuilder();
  }

  withRole(role: MessageRole): this {
    this.role = role;
    return this;
  }

  withText(text: string): this {
    this.text = text;
    return this;
  }

  withImage(imageUrl: string): this {
    this.imageUrl = imageUrl;
    return this;
  }

  withVideo(videoUrl: string): this {
    this.videoUrl = videoUrl;
    return this;
  }

  build(): Message {
    return Message.create({
      role: this.role,
      text: this.text,
      imageUrl: this.imageUrl,
      videoUrl: this.videoUrl,
    });
  }
}
