import { Module } from '@nestjs/common';
import { DocumentEditor } from './application/document-editor';
import { DocumentEvents } from './application/document-events';
import {
  DocumentResourceManager,
  StraightforwardDocumentProcess,
} from './application/document-process';

@Module({
  providers: [
    DocumentEditor,
    DocumentEvents,
    DocumentResourceManager,
    StraightforwardDocumentProcess,
  ],
  exports: [
    DocumentEditor,
    DocumentEvents,
    DocumentResourceManager,
    StraightforwardDocumentProcess,
  ],
})
export class ContractsModule {}
