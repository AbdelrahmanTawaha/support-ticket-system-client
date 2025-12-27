import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { TicketsService } from '../../../services/tickets-service';
import { Ticket } from '../../models/ticket';
import { TicketStatus } from '../../models/ticket-status';
import { TranslateModule } from '@ngx-translate/core';

type StatusLike = TicketStatus | number | string;

@Component({
  selector: 'app-client-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, DatePipe, AsyncPipe,TranslateModule],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
export class ClientTicketsComponent implements OnInit {

  Math = Math;

  tickets$!: Observable<Ticket[]>;
  totalCount$!: Observable<number>;
  loading$!: Observable<boolean>;
  errorMessage$!: Observable<string>;

  pageNumber = 1;
  pageSize = 8;

  searchTerm = '';
  statusFilter: '' | TicketStatus = '';

  readonly ticketStatuses = [
    { value: '', label: 'All' },
    { value: TicketStatus.New, label: 'New' },
    { value: TicketStatus.InProgress, label: 'InProgress' },
    { value: TicketStatus.WaitingClient, label: 'WaitingClient' },
    { value: TicketStatus.Closed, label: 'Closed' },
  ];

  constructor(
    private ticketsService: TicketsService,
    private router: Router
  ) {
    this.tickets$ = this.ticketsService.tickets$;
    this.totalCount$ = this.ticketsService.totalCount$;
    this.loading$ = this.ticketsService.loading$;
    this.errorMessage$ = this.ticketsService.errorMessage$;
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.ticketsService.loadClientTickets({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      status: this.statusFilter === '' ? undefined : this.statusFilter
    });
  }

  onSearchChange(): void {
    this.pageNumber = 1;
    this.load();
  }

  onStatusChange(): void {
    this.pageNumber = 1;
    this.load();
  }

  nextPage(totalCount: number): void {
    const totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
    if (this.pageNumber < totalPages) {
      this.pageNumber++;
      this.load();
    }
  }

  prevPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.load();
    }
  }

  openDetails(id: number): void {
    this.router.navigate(['/tickets', id]);
  }

  // =========================
  // Status helpers
  // =========================
  private normalizeStatus(s: StatusLike): TicketStatus | null {
    if (s === null || s === undefined) return null;

    const n = Number(s);
    if (!Number.isNaN(n)) return n as TicketStatus;

    const key = String(s) as keyof typeof TicketStatus;
    const mapped = (TicketStatus as any)[key];

    return typeof mapped === 'number' ? mapped as TicketStatus : null;
  }

  getStatusLabel(status: StatusLike): string {
    const s = this.normalizeStatus(status);

    switch (s) {
      case TicketStatus.New: return 'New';
      case TicketStatus.InProgress: return 'InProgress';
      case TicketStatus.WaitingClient: return 'WaitingClient';
      case TicketStatus.Closed: return 'Closed';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: StatusLike): string {
    const s = this.normalizeStatus(status);

    switch (s) {
      case TicketStatus.New: return 'chip-new';
      case TicketStatus.InProgress: return 'chip-progress';
      case TicketStatus.WaitingClient: return 'chip-wait';
      case TicketStatus.Closed: return 'chip-closed';
      default: return 'chip-closed';
    }
  }
  openCreate(): void {
  this.router.navigate(['/client/tickets/create']);
}

}
