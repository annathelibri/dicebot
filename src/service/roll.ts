import { singleton } from 'tsyringe';
import { chain, chunk } from 'lodash';
import { RollemParserV1 } from '@rollem/language';
import { ContainerV1 } from '@rollem/language/dist/types';

@singleton()
export class RollService {
  private readonly parser = new RollemParserV1();

  public roll(content: string, strict: boolean = true): string | null {
    return this.rollMany(content, strict) ?? this.rollGrouped(content, strict) ?? this.rollFortune(content, strict);
  }

  private rollFortune(content: string, strict: boolean = true): string | null {
    const match = content.match(/(?:fortune#\s*)?(.*)/i);
    if (!match) {
      return null;
    }

    const result = this.parser.tryParse(match[1]);
    if (!result) {
      return null;
    }

    const headerLine = this.buildResponse(result, strict);
    if (!headerLine) {
      return null;
    }

    function makeOreTag(count: number): string {
      switch (count) {
        case 1:
          return '';
        case 2:
          return ' - Basic Success';
        case 3:
          return ' - Critical Success';
        case 4:
          return ' - Extreme Success';
        case 5:
          return ' - Impossible Success';
        default:
          return ' - IMPOSSIBLE Success';
      }
    }

    const groupedValues = chain(result.values)
      .groupBy()
      .entries()
      .flatMap(([key, values]) => {
        return chunk(values, 5).map(chunkSize => ({ value: key, count: chunkSize.length }));
      })
      .sortBy(group => group.count, group => group.value)
      .reverse()
      .map(group => `${group.count}x [${group.value}] ${makeOreTag(group.count)}`)
      .value();

    return [headerLine, ...groupedValues].join('\n');
  }

  private rollGrouped(content: string, strict: boolean = true): string | null {
    const match = content.match(/(?:(ore|group|groupValue|groupCount|groupSize|groupHeight|groupWidth)#\s*)?(.*)/i);
    if (!(match && match[1])) {
      return null;
    }

    const groupType = match[1].toLowerCase() as 'group' | 'groupValue' | 'groupCount' | 'groupSize' | 'groupHeight' | 'groupWidth' | 'ore';
    const result = this.parser.tryParse(match[2]);
    if (!result) {
      return null;
    }

    const headerLine = this.buildResponse(result, strict);
    if (!headerLine) {
      return null;
    }

    const groupedValues = chain(result.values)
      .groupBy()
      .entries()
      .map(([key, values]) => ({ value: key, count: values.length }));

    let sortedGroupedValues = groupedValues;
    switch (groupType) {
      case 'ore':
      case 'group':
      case 'groupValue':
      case 'groupHeight':
        sortedGroupedValues = groupedValues.sortBy(group => group.value).reverse();
        break;
      case 'groupSize':
      case 'groupCount':
      case 'groupWidth':
        sortedGroupedValues = groupedValues.sortBy(group => group.count).reverse();
        break;
    }
    const groupedValueLines = groupedValues.map(group => `${group.count}x ${group.value}`).value();

    return [headerLine, ...groupedValueLines].join('\n');
  }

  private rollMany(content: string, strict: boolean = true): string | null {
    let count = 1;
    const match = content.match(/(?:(\d+)#\s*)?(.*)/);
    const countRaw = match ? match[1] : false;
    if (countRaw) {
      count = parseInt(countRaw, 10);
      if (count > 100 || count < 1) {
        return null;
      }
    }

    count = count || 1;
    const contentAfterCount = match ? match[2] : content;

    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const result = this.parser.tryParse(contentAfterCount);
      if (!result) {
        return null;
      }

      const response = this.buildResponse(result, strict);
      if (response) {
        lines.push(response);
      }
    }

    if (lines.length === 0) {
      return null;
    }
    return lines.join('\n');
  }

  private buildResponse(result: ContainerV1, strict: boolean = true) {
    if (result.error) {
      return result.error;
    }
    if (strict && (result.depth <= 1 /*|| result.dice < 1*/)) {
      return null;
    }
    let response = '';
    if (result.label && result.label !== '') {
      response += `'${result.label}', `;
    }
    if (typeof (result.value) === 'boolean') {
      result.value = result.value ? '**Success!**' : '**Failure!**';
    }
    //spacing out along with a nice formatting of the role number.
    response += `${result.dice < 1 ? '🔢' : '🎲'} ${result.value} ⟵ ${result.pretties.split(']').join('] ')}`;
    return response;
  }
}
