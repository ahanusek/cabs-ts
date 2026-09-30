export enum DocumentStatus {
  DRAFT = 'draft',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface DocumentUser {
  readonly id: string;
}

// Kept as a course counterexample: state rules and document data share one hierarchy.
export class LegacyDocument {
  protected status = DocumentStatus.DRAFT;
  protected overridePublished = false;
  protected content = '';
  private title = '';
  private verifier: DocumentUser | null = null;

  constructor(
    public readonly number: string,
    private readonly creator: DocumentUser,
  ) {}

  public verifyBy(verifier: DocumentUser): void {
    if (this.status !== DocumentStatus.DRAFT)
      throw new Error('Only drafts can be verified');
    if (this.creator.id === verifier.id)
      throw new Error('Authors cannot verify their own documents');
    this.verifier = verifier;
    this.status = DocumentStatus.VERIFIED;
  }

  public publish(): void {
    if (this.status !== DocumentStatus.VERIFIED)
      throw new Error('Only verified documents can be published');
    this.status = DocumentStatus.PUBLISHED;
  }

  public archive(): void {
    this.status = DocumentStatus.ARCHIVED;
  }

  public changeTitle(title: string): void {
    this.requireEditable();
    this.title = title;
    this.status = DocumentStatus.DRAFT;
  }

  public changeContent(content: string): void {
    if (this.overridePublished) {
      this.content = content;
      return;
    }
    this.requireEditable();
    this.content = content;
    this.status = DocumentStatus.DRAFT;
  }

  public getStatus(): DocumentStatus {
    return this.status;
  }
  public getTitle(): string {
    return this.title;
  }
  public getContent(): string {
    return this.content;
  }

  private requireEditable(): void {
    if (
      this.status === DocumentStatus.PUBLISHED ||
      this.status === DocumentStatus.ARCHIVED
    ) {
      throw new Error('The document cannot be edited in its current state');
    }
  }
}
