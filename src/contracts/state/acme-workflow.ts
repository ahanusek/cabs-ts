import {
  StateBuilder,
  type DynamicWorkflow,
  type TransitionRule,
  type TransitionAction,
} from './dynamic-workflow';

const contentNotEmpty: TransitionRule = {
  name: 'content-not-empty',
  test: (header) => header.hasContent(),
};
const authorIsNotVerifier: TransitionRule = {
  name: 'author-is-not-verifier',
  test: (header, command) =>
    Boolean(command.verifierId) && command.verifierId !== header.getAuthorId(),
};
const changeVerifier: TransitionAction = (header, command) => {
  header.recordVerifier(command.verifierId!);
  return [];
};
const published: TransitionAction = (header) => [
  {
    type: 'document-published',
    documentId: header.id,
    contentId: header.getContentId()?.asString() ?? null,
  },
];
const unpublished: TransitionAction = (header) => [
  {
    type: 'document-unpublished',
    documentId: header.id,
    contentId: header.getContentId()?.asString() ?? null,
  },
];

export function createAcmeWorkflow(): DynamicWorkflow {
  return new StateBuilder('draft')
    .allowContentChange('draft', 'draft')
    .allowContentChange('verified', 'draft')
    .transition(
      'draft',
      'verified',
      [contentNotEmpty, authorIsNotVerifier],
      [changeVerifier],
    )
    .transition('verified', 'published', [contentNotEmpty], [published])
    .transition('draft', 'archived')
    .transition('verified', 'archived')
    .transition('published', 'archived', [], [unpublished])
    .build();
}
