export interface UserTicketCount {
  id: number;
  name: string;
  userType:  number;
  isActive: boolean;
  ticketsCount: number;
  imageUrl?: string | null;
}