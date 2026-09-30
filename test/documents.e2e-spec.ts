import { randomUUID } from 'node:crypto';
import { DocumentEditor } from '../src/contracts/application/document-editor';
import { DocumentEvents } from '../src/contracts/application/document-events';
import {
  DocumentResourceManager,
  StraightforwardDocumentProcess,
} from '../src/contracts/application/document-process';
import { ContentVersion } from '../src/contracts/model/document-values';
import { DocumentHeader } from '../src/contracts/model/document-header.entity';
import { createTestApplication } from './support/test-application';

describe('Versioned documents and persisted workflow', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    application = await createTestApplication();
  });
  afterAll(async () => application.close());
  afterEach(() => application.app.get(DocumentEvents).removeAllListeners());

  it.each([DocumentResourceManager, StraightforwardDocumentProcess])(
    'persists verification through %p',
    async (Process) => {
      const author = randomUUID();
      const verifier = randomUUID();
      const created = await application.run(() =>
        application.app.get(Process).createDocument(author),
      );
      const content = await commit('v1', 'First');
      await application.run(() =>
        application.app.get(Process).changeContent(created.documentId, content),
      );
      await application.run(() =>
        application.app.get(Process).changeState(created.documentId, {
          desiredState: 'verified',
          verifierId: verifier,
        }),
      );
      const header = await application.orm.em
        .fork()
        .findOneOrFail(DocumentHeader, { id: created.documentId });
      expect([
        header.getState(),
        header.getVerifierId(),
        header.getContentId(),
      ]).toEqual(['verified', verifier, content]);
    },
  );

  it('preserves earlier revisions of document content', async () => {
    const first = await commit('v1', 'First');
    const second = await application.run(() =>
      application.app.get(DocumentEditor).commit({
        previousId: first,
        version: new ContentVersion('v2'),
        text: 'Second',
      }),
    );
    const revisions = await application.run(async () => [
      await application.app.get(DocumentEditor).get(first),
      await application.app.get(DocumentEditor).get(second),
    ]);
    expect(
      revisions.map((revision) => [
        revision.text,
        revision.previousId?.asString() ?? null,
      ]),
    ).toEqual([
      ['First', null],
      ['Second', first.asString()],
    ]);
  });

  it('publishes one event after the document transition is committed', async () => {
    const manager = application.app.get(DocumentResourceManager);
    const created = await application.run(() =>
      manager.createDocument(randomUUID()),
    );
    const content = await commit('v1', 'Ready');
    await application.run(() =>
      manager.changeContent(created.documentId, content),
    );
    await application.run(() =>
      manager.changeState(created.documentId, {
        desiredState: 'verified',
        verifierId: randomUUID(),
      }),
    );
    const events: unknown[] = [];
    application.app
      .get(DocumentEvents)
      .on('document-published', (event) => events.push(event));
    await application.run(() =>
      manager.changeState(created.documentId, { desiredState: 'published' }),
    );
    await application.run(() =>
      manager.changeState(created.documentId, { desiredState: 'published' }),
    );
    expect(events).toEqual([
      {
        type: 'document-published',
        documentId: created.documentId,
        contentId: content.asString(),
      },
    ]);
  });

  function commit(version: string, text: string) {
    return application.run(() =>
      application.app.get(DocumentEditor).commit({
        previousId: null,
        version: new ContentVersion(version),
        text,
      }),
    );
  }
});
