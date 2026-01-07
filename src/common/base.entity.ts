import { PrimaryKey } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  public id: string = uuidv4();

  public getId(): string {
    return this.id;
  }
}
