import { Column, Item, Items, Scanner as BaseScanner } from '../scanner';
import { ColumnParser } from './parsers/column';

export type MySQLConfiguration = {
  host: string;
  user: string;
  database: string;
  port: number;
  password: string;
};

type Relation = {
  type: 'belongs-to' | 'has-many';
  columns: string[];
  references: string[];
  on: {
    database: string;
    table: string;
  };
};

export type MySQLColumn = {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string;
  Extra: string;
  Comment: string;
};

interface MySQLTableDefinition {
  Table: string;
  'Create Table': string;
}

interface MySQLTables {
  [key: string]: string;
  Table_type: 'BASE TABLE';
}

export class Scanner implements BaseScanner {
  protected connection;
  protected database: string;
  protected excludes: Record<string, boolean>;
  protected hasManyRelations: Record<string, Relation[]>;
  protected columnParser: ColumnParser;

  public constructor(
    configuration: MySQLConfiguration,
    columnParser: ColumnParser,
    excludes?: string[]
  ) {
    const mysql = require('mysql2');
    this.connection = mysql.createConnection(configuration);
    this.database = configuration.database;
    this.columnParser = columnParser;
    this.hasManyRelations = {};
    this.excludes = {};
    if (excludes) {
      excludes.forEach((table) => {
        this.excludes[table] = true;
      });
    }
  }

  public async scan(): Promise<Items> {
    const tables = await this.tables();
    const tableKey = 'Tables_in_' + this.database;
    const items = [];
    for (const table of tables) {
      const tableName = table[tableKey];
      if (this.excludes[tableName]) {
        continue;
      }

      items.push(await this.table(tableName));
    }

    return items.map((item) => {
      const table = item.table;
      if (this.hasManyRelations[table]) {
        item.relations = item.relations.concat(this.hasManyRelations[table]);
      }

      return item;
    });
  }

  private tables() {
    return this.query<MySQLTables>(
      `SHOW FULL TABLES FROM ${this.database} WHERE Table_type='BASE TABLE'`
    );
  }

  private async table(name: string): Promise<Item> {
    const item: Item = {
      table: name,
      schema: this.database,
      columns: await this.columns(name),
      indexes: [],
      relations: [],
      primaryKey: { columns: [] },
    };
    await this.loadConstraints(name, item);

    return item;
  }

  private async columns(table: string): Promise<Column[]> {
    const columns = await this.query<MySQLColumn>(
      'SHOW FULL COLUMNS FROM ' + table
    );

    return columns.map((column) => this.columnParser.parse(column));
  }

  private async loadConstraints(table: string, item: Item) {
    const record = await this.query<MySQLTableDefinition>(
      'SHOW CREATE TABLE ' + table
    );
    const sql = record[0]['Create Table'].replace(/`/g, '');
    this.loadPrimaryKeys(sql, item);
    this.loadIndexes(sql, item);
    this.loadRelations(table, sql, item);
  }

  private loadRelations(table: string, createTableQuery: string, item: Item) {
    const relations = [
      ...createTableQuery.matchAll(
        /FOREIGN KEY\s+\(([^)]+)\)\s+REFERENCES\s+([^(^\s]+)\s*\(([^)]+)\)/g
      ),
    ];
    if (relations.length === 0) {
      return;
    }

    item['relations'] = relations.map((relation) => {
      const tableReference = this.resolveForeignTable(relation[2]);
      const result: Relation = {
        type: 'belongs-to',
        columns: this.columnize(relation[1]),
        references: this.columnize(relation[3]),
        on: tableReference,
      };
      this.storeHasManyRelation(table, result);

      return result;
    });
  }

  private storeHasManyRelation(table: string, belongsToRelation: Relation) {
    if (belongsToRelation.on.database !== this.database) {
      return;
    }
    const tableRelated = belongsToRelation.on.table;
    if (!this.hasManyRelations[tableRelated]) {
      this.hasManyRelations[tableRelated] = [];
    }

    this.hasManyRelations[tableRelated].push({
      type: 'has-many',
      columns: belongsToRelation.references,
      references: belongsToRelation.columns,
      on: {
        database: this.database,
        table: table,
      },
    });
  }

  private resolveForeignTable(detail: string) {
    const parts = detail.split('.');

    if (parts.length == 2) {
      return {
        database: parts[0],
        table: parts[1],
      };
    }

    return {
      database: this.database,
      table: parts[0],
    };
  }

  private loadIndexes(createTableQuery: string, item: Item) {
    const indexes = [
      ...createTableQuery.matchAll(
        /\s*(UNIQUE)?\s*(KEY|INDEX)\s+(\w+)\s+\(([^)]+)\)/g
      ),
    ];
    if (indexes.length === 0) {
      return;
    }

    item['indexes'] = indexes.map((index) => {
      const type = index[1] || '';
      return {
        type: type.toLowerCase() === 'unique' ? 'unique' : 'index',
        columns: this.columnize(index[4]),
        index: index[3],
      };
    });
  }

  private loadPrimaryKeys(createTableQuery: string, item: Item) {
    const pk = [
      ...createTableQuery.matchAll(/\s*(PRIMARY KEY)\s+\(([^)]+)\)/g),
    ];
    if (pk.length === 0) {
      return;
    }

    item['primaryKey'] = {
      columns: this.columnize(pk[0][2]),
    };
  }

  private columnize(columns: string) {
    return columns
      .trim()
      .split(',')
      .map((column) => column.trim());
  }

  private query<T>(query: string, params = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, params, (err: Error, results: T[]) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  }
}
