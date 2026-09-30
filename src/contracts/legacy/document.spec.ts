import { DocumentStatus, LegacyDocument } from './document';
import { LegacyContract } from './contract';

const author = { id: 'author' };
const reviewer = { id: 'reviewer' };

describe('Legacy document lifecycle', () => {
  it('allows another user to verify a draft', () => {
    const document = new LegacyDocument('1', author);
    document.verifyBy(reviewer);
    expect(document.getStatus()).toBe(DocumentStatus.VERIFIED);
  });

  it('rejects verification by the author', () => {
    expect(() => new LegacyDocument('1', author).verifyBy(author)).toThrow(
      'Authors cannot',
    );
  });

  it('protects the title after publishing', () => {
    const document = new LegacyDocument('1', author);
    document.changeTitle('Title');
    document.verifyBy(reviewer);
    document.publish();
    expect(() => document.changeTitle('Changed')).toThrow('cannot be edited');
  });

  it('returns a changed verified document to draft', () => {
    const document = new LegacyDocument('1', author);
    document.verifyBy(reviewer);
    document.changeContent('Revised');
    expect(document.getStatus()).toBe(DocumentStatus.DRAFT);
  });

  it('demonstrates that a contract cannot substitute a publishable document', () => {
    const document: LegacyDocument = new LegacyContract('1', author);
    document.verifyBy(reviewer);
    expect(() => document.publish()).toThrow('must be accepted');
  });
});
