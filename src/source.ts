import { Source as BaseSource } from 'generathor';
import { Factory, FactoryInput } from './engines/factory';
import { Item } from './engines/scanner';

export type SourceConfiguration = FactoryInput;
export type Transformer = (item: Item) => void;

export class Source extends BaseSource {
  protected $items: Item[] = [];
  protected $transformers?: Transformer[];

  public constructor(
    protected $configuration: SourceConfiguration,
    transformers?: Transformer[]
  ) {
    super();
    this.$transformers = transformers || [];
  }

  public async load(): Promise<void> {
    const scanner = Factory.scanner(this.$configuration);
    this.$items = await scanner.scan();
    for (const transformer of this.$transformers as Transformer[]) {
      for (const item of this.$items) {
        transformer(item);
      }
    }
  }

  public items(): Item[] {
    return this.$items;
  }
}
