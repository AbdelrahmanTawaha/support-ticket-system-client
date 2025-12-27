export interface TicketComment {
  id: number;
  commentText: string;
  authorName: string;
  isFromClient: boolean;
  createdAt: string; // ISO string
}
