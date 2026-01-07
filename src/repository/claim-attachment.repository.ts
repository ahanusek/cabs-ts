import { EntityRepository } from '@mikro-orm/postgresql';
import { ClaimAttachment } from '../entity/claim-attachment.entity';

export class ClaimAttachmentRepository extends EntityRepository<ClaimAttachment> {}
