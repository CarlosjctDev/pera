export type AttachmentOwnerType = 'transaction' | 'account';

export const ATTACHMENT_OWNER_TYPES = ['transaction', 'account'] as const;

export const ATTACHMENT_PDF_MIME = 'application/pdf';

export const ATTACHMENT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
] as const;

export const ATTACHMENT_ALLOWED_MIME_TYPES = [
  ATTACHMENT_PDF_MIME,
  ...ATTACHMENT_IMAGE_MIME_TYPES,
] as const;

export function isAllowedAttachmentMimeType(mimeType: string): boolean {
  return (ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isPdfAttachment(mimeType: string): boolean {
  return mimeType === ATTACHMENT_PDF_MIME;
}

export interface Attachment {
  readonly id?: number;
  readonly ownerType: AttachmentOwnerType;
  readonly ownerId: number;
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly data: Blob;
}

export type NewAttachment = Omit<Attachment, 'id'>;