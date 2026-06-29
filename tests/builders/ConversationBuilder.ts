import { Conversation } from '@domain/entities/Conversation';
import type { Message } from '@domain/entities/Message';
import { ConversationId } from '@domain/value-objects/ConversationId';

/** Test Data Builder para Conversations pre-pobladas. */
export class ConversationBuilder {
  private id: ConversationId = ConversationId.of('conv-test');
  private readonly messages: Message[] = [];
  private title: string | undefined = undefined;

  static aConversation(): ConversationBuilder {
    return new ConversationBuilder();
  }

  withId(id: ConversationId): this {
    this.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withMessage(message: Message): this {
    this.messages.push(message);
    return this;
  }

  build(): Conversation {
    const conversation = Conversation.start(this.id, this.title);
    for (const message of this.messages) {
      conversation.addMessage(message);
    }
    return conversation;
  }
}
