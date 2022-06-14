export type Column = {
  name: string;
  nullable: boolean;
  default: string;
  comment: string;
  type: string
  subType?: string;
  unsigned?: boolean;
  enum?: string[];
  size?: number;
  autoincrement?: boolean;
  scale?: number;
};
export type Index = {
  type: 'unique' | 'index';
  columns: string[];
  index: string;
};
export type Relation = {
  type: 'belongs-to' | 'has-many';
  columns: string[];
  references: string[];
  on: {
    database: string;
    table: string
  };
};
export type Item = {
  table: string;
  schema: string;
  columns: Column[];
  indexes: Index[];
  relations: Relation[];
  primaryKey: {
    columns: string[]
  };
};
export type Items = Item[];

export interface Scanner {
  scan(): Promise<Items>;
}
