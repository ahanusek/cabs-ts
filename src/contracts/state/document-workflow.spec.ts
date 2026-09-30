import { DocumentHeader } from '../model/document-header.entity';
import { ContentId, DocumentNumber } from '../model/document-values';
import { StraightforwardWorkflow } from './straightforward-workflow';
import { createAcmeWorkflow } from './acme-workflow';

const workflows = [
  ['class-based', () => new StraightforwardWorkflow()],
  ['configured', createAcmeWorkflow],
] as const;

describe.each(workflows)('%s document states', (_name, createWorkflow) => {
  it('requires content before verification', () => {
    const workflow = createWorkflow();
    expect(
      workflow.changeState(draft(), {
        desiredState: 'verified',
        verifierId: 'reviewer',
      }).accepted,
    ).toBe(false);
  });

  it('rejects self-verification by the author', () => {
    const workflow = createWorkflow();
    const header = draft();
    workflow.changeContent(header, new ContentId());
    expect(
      workflow.changeState(header, {
        desiredState: 'verified',
        verifierId: 'author',
      }).accepted,
    ).toBe(false);
  });

  it('records a different verifier', () => {
    const workflow = createWorkflow();
    const header = draft();
    workflow.changeContent(header, new ContentId());
    workflow.changeState(header, {
      desiredState: 'verified',
      verifierId: 'reviewer',
    });
    expect([header.getState(), header.getVerifierId()]).toEqual([
      'verified',
      'reviewer',
    ]);
  });

  it('protects published content', () => {
    const workflow = createWorkflow();
    const header = draft();
    const original = new ContentId();
    workflow.changeContent(header, original);
    workflow.changeState(header, {
      desiredState: 'verified',
      verifierId: 'reviewer',
    });
    workflow.changeState(header, { desiredState: 'published' });
    workflow.changeContent(header, new ContentId());
    expect([header.getState(), header.getContentId()]).toEqual([
      'published',
      original,
    ]);
  });

  it('returns to draft when verified content changes', () => {
    const workflow = createWorkflow();
    const header = draft();
    workflow.changeContent(header, new ContentId());
    workflow.changeState(header, {
      desiredState: 'verified',
      verifierId: 'reviewer',
    });
    const revised = new ContentId();
    workflow.changeContent(header, revised);
    expect([header.getState(), header.getContentId()]).toEqual([
      'draft',
      revised,
    ]);
  });

  it('does not share document state between workflow executions', () => {
    const workflow = createWorkflow();
    const first = draft();
    const second = draft();
    workflow.changeContent(first, new ContentId());
    workflow.changeState(first, {
      desiredState: 'verified',
      verifierId: 'reviewer',
    });
    expect([second.getState(), second.getContentId()]).toEqual(['draft', null]);
  });
});

describe('Configured transition actions', () => {
  it('emits publishing and unpublishing only for actual transitions', () => {
    const workflow = createAcmeWorkflow();
    const header = draft();
    workflow.changeContent(header, new ContentId());
    workflow.changeState(header, {
      desiredState: 'verified',
      verifierId: 'reviewer',
    });
    const published = workflow.changeState(header, {
      desiredState: 'published',
    });
    const repeated = workflow.changeState(header, {
      desiredState: 'published',
    });
    const archived = workflow.changeState(header, { desiredState: 'archived' });
    expect(
      [...published.events, ...repeated.events, ...archived.events].map(
        (event) => event.type,
      ),
    ).toEqual(['document-published', 'document-unpublished']);
  });

  it('describes transition rules for the application', () => {
    expect(createAcmeWorkflow().describe(draft())).toEqual({
      contentEditable: true,
      transitions: {
        verified: ['content-not-empty', 'author-is-not-verifier'],
        archived: [],
      },
    });
  });
});

function draft(): DocumentHeader {
  return new DocumentHeader('author', new DocumentNumber('DOC/1'));
}
