import {MySQLConfiguration, Scanner as MySQLScanner} from './mysql/scanner';
import {Scanner} from './scanner';
import {ColumnParser} from './mysql/parsers/column';

export type FactoryInput = {
  type: 'mysql';
  configuration: MySQLConfiguration,
  excludes?: string[],
};

export class Factory {
  public static scanner(input: FactoryInput): Scanner {
    switch (input.type) {
      case 'mysql':  return new MySQLScanner(
        input.configuration,
        new ColumnParser(),
        input.excludes
      );
      default: throw new Error('Database type not supported');
    }
  }
}
