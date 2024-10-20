import { Column } from '../../scanner';
import { MySQLColumn } from '../scanner';

export class ColumnParser {
  private types: Record<string, string> = {};
  private subTypes: Record<string, string> = {};

  public constructor() {
    const mappings: Record<string, string[]> = {
      string: [
        'varchar',
        'text',
        'string',
        'char',
        'enum',
        'tinytext',
        'mediumtext',
        'longtext',
      ],
      date: ['datetime', 'year', 'date', 'time', 'timestamp'],
      int: ['bigint', 'int', 'integer', 'tinyint', 'smallint', 'mediumint'],
      float: [
        'float',
        'decimal',
        'numeric',
        'dec',
        'fixed',
        'double',
        'real',
        'double precision',
      ],
      boolean: ['longblob', 'blob', 'bit'],
    };
    for (const type in mappings) {
      for (const dbType of mappings[type]) {
        this.types[dbType] = type;
      }
    }
    const subTypes: Record<string, string[]> = {
      datetime: ['datetime', 'timestamp'],
      date: ['date'],
      year: ['year'],
      time: ['time'],
    };
    for (const subType in subTypes) {
      for (const dbSubType of subTypes[subType]) {
        this.subTypes[dbSubType] = subType;
      }
    }
  }

  public parse(column: MySQLColumn): Column {
    const result: Partial<Column> = {
      name: column['Field'],
      nullable: column['Null'] === 'YES',
      default: column['Default'],
      comment: column['Comment'],
    };
    this.parseType(column['Type'] || 'string', result);
    this.parseAutoincrement(column['Extra'], result);

    return result as Column;
  }

  private parseAutoincrement(data: string, result: Partial<Column>) {
    if (data === 'auto_increment') {
      result['autoincrement'] = true;
    }
  }

  private parseType(data: string, result: Partial<Column>) {
    const parts: RegExpExecArray = /^(\w+)(?:\(([^\)]+)))?/.exec(
      data
    ) as RegExpExecArray;

    const dbType = parts[1].toLowerCase();

    result['type'] = this.types[dbType] || dbType;
    if (this.subTypes[dbType]) {
      result['subType'] = this.subTypes[dbType];
    }

    if (parts[2]) {
      this.parsePrecision(dbType, parts[2], result);
    }

    if (result['type'] === 'int' || result['type'] === 'float') {
      result['unsigned'] = parts.input.includes('unsigned');
    }

    if (result['scale']) {
      console.log(data);
      console.log(parts);
      console.log(result);
      process.exit(1);
    }
  }

  private parsePrecision(
    dbType: string,
    data: string,
    result: Partial<Column>
  ) {
    const precision = data.replace(/'/g, '').split(',');

    if (dbType === 'enum') {
      result['enum'] = precision;

      return;
    }

    const size = parseInt(precision[0]);
    const boolTypes: Record<string, boolean> = {
      bit: true,
      tinyint: true,
    };

    if (size === 1 && boolTypes[dbType]) {
      result['type'] = 'bool';

      return;
    }

    result['size'] = size;

    if (precision[1]) {
      result['scale'] = parseInt(precision[1]);
    }
  }
}
