import {Column} from '../../scanner';

export class ColumnParser {
  private types = {};
  private subTypes = {};

  public constructor() {
    const mappings = {
      string: ['varchar', 'text', 'string', 'char', 'enum', 'tinytext', 'mediumtext', 'longtext'],
      date: ['datetime', 'year', 'date', 'time', 'timestamp'],
      int: ['bigint', 'int', 'integer', 'tinyint', 'smallint', 'mediumint'],
      float: ['float', 'decimal', 'numeric', 'dec', 'fixed', 'double', 'real', 'double precision'],
      boolean: ['longblob', 'blob', 'bit'],
    };
    for (const type in mappings) {
      for (const dbType of mappings[type]) {
        this.types[dbType] = type;
      }
    }
    const subTypes = {
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

  public parse(column: Record<string, any>): Column {
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

  private parseAutoincrement(data, result) {
    if (data === 'auto_increment') {
      result['autoincrement'] = true;
    }
  }

  private parseType(data, result) {
    const parts = /^(\w+)(?:\(([^\)]+)\))?/.exec(data);
    let dbType = parts[1].toLowerCase();

    result['type'] = this.types[dbType] || dbType;
    if (this.subTypes[dbType]) {
      result['subType'] = this.subTypes[dbType];
    }

    if (parts[2]) {
      this.parsePrecision(dbType, parts[2], result);
    }

    if (result['type'] === 'int') {
      result['unsigned'] = dbType.includes('unsigned');
    }
  }

  private parsePrecision(dbType, data, result) {
    const precision = data.replace(/'/g, '').split(',');

    if (dbType === 'enum') {
      result['enum'] = precision;

      return;
    }

    const size = parseInt(precision[0]);
    const boolTypes = {
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
