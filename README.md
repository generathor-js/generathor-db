
<p align="center">
  <img src="https://cldup.com/U-06c9VkSH.png" alt="Generathor">
  <img src="https://cldup.com/KRISyl7sqL.png" alt="DB" width="130">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/generathor-db">
    <img src="https://img.shields.io/npm/v/generathor-db.svg" alt="NPM">
  </a>
  <a href="https://npmcharts.com/compare/generathor-db?minimal=true">
    <img src="https://img.shields.io/npm/dt/generathor-db.svg" alt="Downloads">
  </a>
  <a href="https://www.npmjs.com/package/generathor-db">
    <img src="https://img.shields.io/npm/l/generathor-db.svg" alt="License">
  </a>
</p>

# Generathor-DB

**Generathor-DB** retrieves the structure of a database, including tables, columns, indexes, relations, and primary keys in a standardized format. This allows for the automation of code generation, such as models, controllers, migrations, and more, based on the database schema.

## How does it work?

Generathor-DB requires a configuration object to connect to the database. Optionally, you can pass an array of transformers to modify the data before it is used to generate files.

```ts
import { Source } from 'generathor-db';

const source = new Source({
  type: 'mysql',
  configuration: {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'password',
    database: 'generathor'
  }
}, [
    (item) => {
      item.columns.forEach(column => {
        column.calculated = column.name.toUpperCase(); // Example transformation
      });
    }
]);
```

### Parameters

| Variable              | Required | Type                                        | Description                                      |
|-----------------------|----------|---------------------------------------------|--------------------------------------------------|
| `sourceConfiguration` | `Yes`    | [SourceConfiguration](#SourceConfiguration) | Configuration to connect to the database.        |
| `transformer`         | `No`     | [Transformer](#Transformer)[]               | Array of functions to modify items before usage. |

#### SourceConfiguration

| Variable        | Required | Type                                      | Description                          |
|-----------------|----------|-------------------------------------------|--------------------------------------|
| `type`          | `Yes`    | 'mysql'                                   | At the moment we only support mysql. |
| `configuration` | `Yes`    | [MySQLConfiguration](#MySQLConfiguration) | Configuration for the database.      |

#### MySQLConfiguration

See [mysql2](https://sidorares.github.io/node-mysql2/docs) for more information.

#### Transformer

Callback that receives the items and allows you to modify or add information for file generation.

### Item format

This source retrieves an array of items, and each item has information about one table of the database.

| Variable             | Required | Type                      | Description                         |
|----------------------|----------|---------------------------|-------------------------------------|
| `table`              | `Yes`    | string                    | Name of the table.                  |
| `schema`             | `Yes`    | string                    | Name of the schema.                 |
| `columns`            | `Yes`    | [Column](#Column)[]       | List of columns in the table.       |
| `indexes`            | `Yes`    | [Index](#Index)[]         | List of indexes in the table.       |
| `relations`          | `Yes`    | [Relation](#Relation)[]   | List of table relations.            |
| `primaryKey`         | `Yes`    | object                    | Primary key of the table.           |
| `primaryKey.columns` | `Yes`    | string[]                  | List of columns in the primary key. |

#### Column

| Variable       | Required | Type                      | Description                                   |
|----------------|----------|---------------------------|-----------------------------------------------|
| `name`         | `Yes`    | string                    | Name of the column.                           |
| `nullable`     | `Yes`    | boolean                   | Indicates if column allows null values.       |
| `default`      | `Yes`    | string                    | Default value of the column.                  |
| `comment`      | `Yes`    | string                    | Comment or description of the column.         |
| `type`         | `Yes`    | string                    | Type of column (e.g., `int`, `varchar`).      |
| `subType`      | `No`     | string                    | Subtype of the column, if applicable.         |
| `unsigned`     | `No`     | boolean                   | Indicates if the column is unsigned.          |
| `enum`         | `No`     | string[]                  | List of valid values for `enum` types.        |
| `size`         | `No`     | number                    | Size of the column (if applicable).           |
| `autoincrement`| `No`     | boolean                   | Indicates if the column auto-increments.      |
| `scale`        | `No`     | number                    | Decimal scale for numeric columns.            |

#### Index

| Variable  | Required | Type                      | Description                                   |
|-----------|----------|---------------------------|-----------------------------------------------|
| `type`    | `Yes`    | 'unique' or 'index'       | Type of index (unique or regular).            |
| `columns` | `Yes`    | string[]                  | Columns involved in the index.                |
| `index`   | `Yes`    | string                    | Name of the index.                            |

#### Relation

| Variable      | Required | Type                       | Description                                           |
|---------------|----------|----------------------------|-------------------------------------------------------|
| `type`        | `Yes`    | 'belongs-to' or 'has-many' | Type of relationship between tables.                  |
| `columns`     | `Yes`    | string[]                   | Columns involved in the relationship.                 |
| `references`  | `Yes`    | string[]                   | Columns referenced in the related table.              |
| `on`          | `Yes`    | object                     | Details of the related table.                         |
| `on.database` | `Yes`    | string                     | Name of the database where the related table resides. |
| `on.table`    | `Yes`    | string                     | Name of the related table.                            |

## TODO

- [ ] Add support for additional database engines (PostgreSQL, SQLite, etc.).
