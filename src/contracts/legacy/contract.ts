import { DocumentStatus, LegacyDocument } from './document';

export class LegacyContract extends LegacyDocument {
  public override publish(): void {
    throw new Error('Contracts must be accepted instead of published');
  }

  public accept(): void {
    if (this.status === DocumentStatus.VERIFIED)
      this.status = DocumentStatus.PUBLISHED;
  }

  public override changeTitle(title: string): void {
    super.changeContent(title + this.content);
  }

  public changeContentForSalesOfficer(content: string): void {
    this.overridePublished = true;
    this.changeContent(content);
  }
}
