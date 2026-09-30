import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';

@Entity()
export class Party {
  @PrimaryKey({ type: 'uuid' })
  public readonly id: string;
  constructor(id: string) {
    this.id = id;
  }
}
