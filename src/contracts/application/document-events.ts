import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { DocumentEvent } from '../state/document-workflow';

@Injectable()
export class DocumentEvents extends EventEmitter {
  public publish(event: DocumentEvent): void {
    this.emit(event.type, event);
  }
}
