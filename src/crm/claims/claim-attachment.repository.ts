import { EntityRepository } from '@mikro-orm/postgresql';
import { ClaimAttachment } from './claim-attachment.entity';

export class ClaimAttachmentRepository extends EntityRepository<ClaimAttachment> {}
