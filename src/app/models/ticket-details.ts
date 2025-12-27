import { TicketComment } from './ticket-comment';
import { TicketStatus } from '../models/ticket-status';
import { TicketAttachment } from './ticket-attachment';

export interface TicketDetails {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  clientName: string;
  assignedEmployeeName?: string | null;
  productName: string;
  createdAt: string;
  comments: TicketComment[];
    attachments?: TicketAttachment[];

}