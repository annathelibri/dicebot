import { singleton } from 'tsyringe';
import NodeCache from 'node-cache';
import { Message } from 'discord.js';

@singleton()
export class KnownMessagesService extends NodeCache {
  constructor() {
    super({
      stdTTL: 5, // seconds
      checkperiod: 5, // seconds
      deleteOnExpire: true,
      useClones: false, // go fast
    });
  }

  public alreadyReplied(message: Message): boolean {
    const key = `${message.guild?.id}-${message.channel?.id}-${message.id}`;
    if (this.has(key)) {
      return true;
    }

    this.set(key, true);
    return false;
  }
}
