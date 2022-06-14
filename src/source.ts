import {Source as BaseSource, Item} from 'generathor';
import {Factory, FactoryInput} from './engines/factory';

export type SourceConfiguration = FactoryInput;

export class Source extends BaseSource {
  protected $items: Item[] = [];

  public constructor(
    protected $configuration: SourceConfiguration
  ) {
    super();
  }

  public async load(): Promise<void> {
    const scanner = Factory.scanner(this.$configuration);
    this.$items = await scanner.scan();
  }

  public items(): Item[] {
    return this.$items;
  }
}
