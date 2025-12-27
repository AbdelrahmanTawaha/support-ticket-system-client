export interface TicketAttachment {
  id: number;
  ticketId: number;

  fileName: string;
  filePath: string;
  fileSizeInBytes: number;
  uploadedAt: string;

  uploadedByUserId: number;
  uploadedByName?: string | null;
}
