import { singleton } from 'tsyringe';
import { Client, Message } from 'discord.js';
import { KnownMessagesService } from '@/service/knownMessages';
import { RollService } from '@/service/roll';
import { fromMilliseconds } from '@/utils/duration';

@singleton()
export class Application {
  private readonly client = new Client({
    intents: ['DirectMessages', 'Guilds', 'GuildMessages', 'MessageContent'],
  });
  // noinspection RegExpUnexpectedAnchor
  private prefix = /$^/g; // this is a regex that matches nothing

  constructor(
    private readonly knownMessages: KnownMessagesService,
    private readonly roll: RollService,
  ) {
  }

  async init() {
    const specialHandling = this.specialHandling();
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot || this.knownMessages.alreadyReplied(message)) return;
      const raw = message.content;
      let match = raw.match(this.prefix);
      if (!match) return;
      const content = raw.substring(match[0].length);
      if (await specialHandling(message, content)) return;
      const result = await this.roll.roll(content);
      if (result) {
        await message.reply(result);
      }
    });

    await this.client.login(process.env.BOT_TOKEN);
    this.client.user!.setActivity({
      name: `${process.env.BOT_PREFIX ?? 'd!'}help | ${process.env.BOT_MOTTO ?? 'Roll\'it!'}`,
    });
    this.calculatePrefix();
  }

  private calculatePrefix() {
    const id = this.client.user!.id;
    this.prefix = new RegExp(
      `^(?:<@${id}>|<@!${id}>|${process.env.BOT_PREFIX_REGEX ?? process.env.BOT_PREFIX ?? '[Dd]!'})\\s*`,
    );
  }

  private specialHandling(): (message: Message, content: string) => Promise<boolean> {
    const helpRegExp = /^h[ae]+lp+/;
    const flipRegExp = /^(?:coin|flip|coinflip|flipcoin|flip *a? *coin)/;
    const statRegExp = /^(?:stat(?:istic)?s?|uptime)/;
    const rollRegExp = /^(?:roll *a? *(?:dic?e)?|dic?e|math|homework|r|&)\s*/;

    return async (message, content) => {
      const name = process.env.BOT_NAME ?? 'DragonDice';
      const prefix = process.env.BOT_PREFIX ?? 'd!';
      if (helpRegExp.test(content)) {
        await message.reply([
          `Hello, I'm **${name}**, a dice rolling bot! Send ${prefix}1d20 to roll a 20-sided die!`,
          '> 💡 Rollem-syntax is fully supported, check the docs for more:',
          '> https://rollem.rocks/docs/v1-syntax',
        ].join('\n'));
        return true;
      }
      if (flipRegExp.test(content)) {
        await message.reply(['🟢 Heads!', '🟡 Tails!'][Math.floor(Math.random() * 2)]);
        return true;
      }
      if (statRegExp.test(content)) {
        let guilds = this.client.guilds.valueOf().size;
        await message.reply([
          `> **${name}** - Stats:`,
          ` · I've been up for ${this.uptime()}!`,
          ` · I'm currently in ${guilds} guild${guilds === 1 ? '' : 's'}!`,
        ].join('\n'));
        return true;
      }
      if (rollRegExp.test(content)) {
        const inner = content.substring(content.match(rollRegExp)![0].length);
        const result = await this.roll.roll(inner.length > 0 ? inner : '1d20', false);
        if (result) {
          await message.reply(result);
        }
      }
      return false;
    };
  }

  private uptime() {
    const parts = Object.entries(fromMilliseconds(this.client.uptime!)).reduce((acc, [key, value]) => {
      if (value > 0 && key != 'milliseconds') acc.push(`${value} ${value > 1 ? key : key.substring(0, key.length - 1)}`);
      return acc;
    }, [] as string[]);
    if (parts.length > 2) return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
    return parts.join(' and ');
  }
}
