import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NgForOf, NgIf, NgClass, DatePipe, AsyncPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { Ticket } from '../../models/ticket';
import { TicketStatus } from '../../models/ticket-status';
import { TicketsService } from '../../../services/tickets-service';
import { EmployeeOption } from '../../models/employee-option';
import { ApiResponse } from '../../models/ApiResponse';
import { AiAssignSuggestResponseDto } from '../../models/ai-assign-suggest';

type StatusOption = { value?: TicketStatus; label: string };

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [NgForOf, NgIf, NgClass, FormsModule, DatePipe, AsyncPipe,DecimalPipe],
  templateUrl: './tickets-list.html',
  styleUrl: './tickets-list.css',
})
export class TicketsList implements OnInit, OnDestroy {

  Math = Math;

  tickets$!: Observable<Ticket[]>;
  totalCount$!: Observable<number>;
  loading$!: Observable<boolean>;
  errorMessage$!: Observable<string>;

  pageNumber = 1;
  pageSize = 10;

  searchTerm = '';
  statusFilter: TicketStatus | undefined = undefined;
 aiLoading: Record<number, boolean> = {};
 aiSuggest: Record<number, AiAssignSuggestResponseDto | null> = {};
 aiError: Record<number, string | null> = {};
  readonly ticketStatuses: StatusOption[] = [
    { value: undefined, label: 'All' },
    { value: TicketStatus.New, label: 'New' },
    { value: TicketStatus.InProgress, label: 'InProgress' },
    { value: TicketStatus.WaitingClient, label: 'WaitingClient' },
    { value: TicketStatus.Closed, label: 'Closed' },
  ];

  //  Assign UI State
  employees: EmployeeOption[] = [];
  assigning: Record<number, boolean> = {};
  selectedEmployee: Record<number, number | null> = {};

  //  Popover state
  openAssignFor: number | null = null;

  //  Popover search
  employeeSearch = '';

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
    this.reloadTickets();
    this.loadEmployees();
  }

  ngOnDestroy(): void {}

  // =========================
  // Load Tickets
  // =========================
  private reloadTickets(): void {
    this.ticketsService.loadAdminTickets({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      status: this.statusFilter,
    });
  }

  // =========================
  // Load Employees (for assign)
  // =========================
  private loadEmployees(): void {
    this.ticketsService.getSupportEmployees().subscribe({
      next: (res: ApiResponse<EmployeeOption[]>) => {
        if (res.errorCode === 0 && res.data) {
          //  فقط النشطين
          this.employees = res.data.filter(e => e.isActive);
        } else {
          this.employees = [];
        }
      },
      error: () => {
        this.employees = [];
      }
    });
  }

  // filtered list getter
  get filteredEmployees(): EmployeeOption[] {
    const term = this.employeeSearch?.trim().toLowerCase();
    if (!term) return this.employees ?? [];
    return (this.employees ?? []).filter(e =>
      (e.name ?? '').toLowerCase().includes(term)
    );
  }

  // =========================
  // Filters
  // =========================
  onSearchChange(): void {
    this.pageNumber = 1;
    this.reloadTickets();
  }

  onStatusChange(): void {
    this.pageNumber = 1;
    this.reloadTickets();
  }

  refresh(): void {
    this.onSearchChange();
    this.loadEmployees();
  }

  // =========================
  // Pagination
  // =========================
  changePage(page: number, totalCount: number): void {
    if (page < 1) return;

    const totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
    if (page > totalPages) return;

    this.pageNumber = page;
    this.reloadTickets();
  }

  nextPage(totalCount: number): void {
    this.changePage(this.pageNumber + 1, totalCount);
  }

  prevPage(totalCount: number): void {
    this.changePage(this.pageNumber - 1, totalCount);
  }

  // =========================
  // Navigation
  // =========================
  openDetails(id: number): void {
    this.router.navigate(['/tickets', id]);
  }

  // =========================
  // Status label/class
  // =========================
  getStatusLabel(status: TicketStatus | string | null | undefined): string {
    if (status === null || status === undefined) return 'Unknown';
    if (typeof status === 'number') return TicketStatus[status] ?? 'Unknown';
    return status;
  }

  getStatusClass(status: TicketStatus | string | null | undefined): string {
    return this.getStatusLabel(status);
  }

  // =========================
  //  Assign Popover Controls
  // =========================
  toggleAssignMenu(ticketId: number, ev?: Event): void {
  ev?.stopPropagation();

  
  const list = this.ticketsService['ticketsSubject']?.getValue?.() as Ticket[] | undefined;
  const t = (list ?? []).find(x => x.id === ticketId);
  if (t && this.isAssigned(t)) return;

  if (!this.employees?.length) return;

  const isOpening = this.openAssignFor !== ticketId;
  this.openAssignFor = isOpening ? ticketId : null;

  if (isOpening) this.employeeSearch = '';

  if (this.selectedEmployee[ticketId] === undefined) {
    this.selectedEmployee[ticketId] = null;
  }
}


  closeAssignMenu(ev?: Event): void {
    ev?.stopPropagation();
    this.openAssignFor = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openAssignFor = null;
  }

  isAssigned(t: Ticket): boolean {
 
  const anyT: any = t as any;
  return !!(anyT.assignedEmployeeId ?? t.assignedEmployeeName);
}

canAssign(t: Ticket): boolean {
  return !this.isAssigned(t);
}

  // =========================
  //  Employees selection
  // =========================
  selectEmployee(ticketId: number, employeeId: number): void {
    this.selectedEmployee[ticketId] = employeeId;
  }

  clearEmployee(ticketId: number): void {
    this.selectedEmployee[ticketId] = null;
  }

  getInitials(name?: string | null): string {
    if (!name) return 'NA';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // =========================
  // Assign Action
  // =========================
  assignTicket(ticket: Ticket, ev?: Event): void {
    ev?.stopPropagation();
if (this.isAssigned(ticket)) return; 

    const empId = this.selectedEmployee[ticket.id];

    if (!empId) return;
    if (!this.employees?.length) return;

    const targetEmp = this.employees.find(e => e.id === empId);
    if (!targetEmp || !targetEmp.isActive) return;

    this.assigning[ticket.id] = true;

    this.ticketsService.assignTicket(ticket.id, empId).subscribe({
      next: (res: ApiResponse<boolean>) => {
        this.assigning[ticket.id] = false;

        if (res.errorCode !== 0 || !res.data) return;

      
        this.ticketsService.updateTicketLocally((list: Ticket[]) =>
          list.map((t: Ticket) =>
            t.id === ticket.id
              ? {
                  ...t,
                  assignedEmployeeName: targetEmp.name ?? t.assignedEmployeeName,
                  status: 'InProgress' as any, 
                }
              : t
          )
        );

        this.openAssignFor = null;
      },
      error: () => {
        this.assigning[ticket.id] = false;
      }
    });
  }
  runAiSuggest(ticketId: number, ev?: Event): void {
  ev?.stopPropagation();

  this.aiLoading[ticketId] = true;
  this.aiError[ticketId] = null;
  this.aiSuggest[ticketId] = null;

  this.ticketsService.aiAssignSuggest(ticketId).subscribe({
    next: (res) => {
      this.aiLoading[ticketId] = false;

      if (!res || res.errorCode !== 0 || !res.data) {
        this.aiError[ticketId] = res?.msgError ?? 'AI failed.';
        return;
      }

      this.aiSuggest[ticketId] = res.data;

      if (res.data.suggestedEmployeeId) {
        this.selectedEmployee[ticketId] = res.data.suggestedEmployeeId;
      }
    },
    error: () => {
      this.aiLoading[ticketId] = false;
      this.aiError[ticketId] = 'AI request failed.';
    }
  });
}

applyAiSuggestion(ticketId: number, ev?: Event): void {
  ev?.stopPropagation();

  const s = this.aiSuggest[ticketId];
  if (!s?.suggestedEmployeeId) return;

  this.selectedEmployee[ticketId] = s.suggestedEmployeeId;
}

}
