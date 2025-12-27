import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { environment } from '../environments/environment';
import { TicketQuery } from '../app/models/ticket-query';
import { ApiResponse, PageResponse } from '../app/models/ApiResponse';
import { Ticket } from '../app/models/ticket';
import { TicketDetails } from '../app/models/ticket-details';
import { TicketComment } from '../app/models/ticket-comment';
import { EmployeeOption } from '../app/models/employee-option';
import { UserTicketCount } from '../app/models/user-ticket-count';
import { UserEdit } from '../app/models/user-edit';
import { UpdateUserRequest } from '../app/models/user-update-request';
import { CreateSupportEmployeeRequest } from '../app/models/create-support-employee';
import { TicketAttachment } from '../app/models/ticket-attachment';
import { CreateTicketRequest } from '../app/models/create-ticket-request';
import { ProductOption } from '../app/models/product-option';
import { AiAssignSuggestResponseDto } from '../app/models/ai-assign-suggest';
import { TicketUpdateDetailsRequest } from '../app/models/ticket-update-details-request';

export type UsersCountsQuery = {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  userType?: number | null;   // 1 = SupportEmployee, 2 = ExternalClient
  isActive?: boolean | null;  // true/false/null
};

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly baseUrl = `${environment.apiUrl}/Tickets`;
  private readonly usersUrl = `${environment.apiUrl}/Users`;
  private readonly productsUrl = `${environment.apiUrl}/Products`;


  private readonly profileUrl = `${environment.apiUrl}/profile`;

  // ----- Tickets state -----
  private readonly ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  readonly tickets$ = this.ticketsSubject.asObservable();

  private readonly totalCountSubject = new BehaviorSubject<number>(0);
  readonly totalCount$ = this.totalCountSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  private readonly errorMessageSubject = new BehaviorSubject<string>('');
  readonly errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(private http: HttpClient) {}

  // =========================================================
  // TICKETS LIST (Role-based)
  // =========================================================

  loadAdminTickets(query: TicketQuery): void {
    this.loadTicketsCore('/admin', query);
  }

  loadEmployeeTickets(query: TicketQuery): void {
    this.loadTicketsCore('/employee', query);
  }

  loadClientTickets(query: TicketQuery): void {
    this.loadTicketsCore('/client', query);
  }

  
  loadTickets(query: TicketQuery): void {
    this.loadAdminTickets(query);
  }

  private loadTicketsCore(path: string, query: TicketQuery): void {
    const params = this.buildParams(query);

    this.loadingSubject.next(true);
    this.errorMessageSubject.next('');

    this.http
      .get<PageResponse<Ticket[]>>(`${this.baseUrl}${path}`, { params })
      .subscribe({
        next: (res) => this.handleListResponse(res),
        error: () => this.handleListError(),
      });
  }

  // =========================================================
  // TICKETS DETAILS
  // =========================================================
updateTicketDetails(
  ticketId: number,
  body: TicketUpdateDetailsRequest 
): Observable<ApiResponse<TicketDetails>> {

  const payload: TicketUpdateDetailsRequest = {
    title: body.title?.trim(),
    description: body.description ?? null
  };

  return this.http
    .put<ApiResponse<TicketDetails>>(`${this.baseUrl}/${ticketId}/details`, payload)
    .pipe(
      map(res => {
        if (res.errorCode !== 0 || !res.data) {
          throw new Error(res.msgError || 'Failed to update ticket details');
        }
        return res; 
      })
    );
}
  getTicketDetails(id: number): Observable<TicketDetails> {
    return this.http
      .get<ApiResponse<TicketDetails>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(res => {
          if (res.errorCode !== 0 || !res.data) {
            throw new Error(res.msgError || 'Failed to load ticket details');
          }
          return res.data;
        })
      );
  }

  // =========================================================
  // COMMENTS
  // =========================================================

  addComment(ticketId: number, commentText: string): Observable<ApiResponse<TicketComment>> {
    return this.http.post<ApiResponse<TicketComment>>(
      `${this.baseUrl}/${ticketId}/comments`,
      { commentText }
    );
  }


  // =========================================================
  // CLIENT CONFIRMATION FLOW
  // =========================================================

  // Employee/Manager: move to WaitingClient
  markWaitingClient(ticketId: number): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(
      `${this.baseUrl}/${ticketId}/waiting-client`,
      {}
    );
  }

  clientDecision(ticketId: number, action: 'confirm' | 'reject'): Observable<ApiResponse<boolean>> {
  return this.http.put<ApiResponse<boolean>>(
    `${this.baseUrl}/${ticketId}/client-decision`,
    { action }
  );
}

  // =========================================================
  // ASSIGN (Admin)
  // =========================================================

  assignTicket(ticketId: number, employeeId: number): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(
      `${this.baseUrl}/${ticketId}/assign`,
      { employeeId }
    );
  }
aiAssignSuggest(ticketId: number) {
  return this.http.post<ApiResponse<AiAssignSuggestResponseDto>>(
    `${this.baseUrl}/${ticketId}/ai-assign-suggest`,
    {}
  );
}

  // =========================================================
  // USERS (Manager)
  // =========================================================

  getUserForEdit(userId: number): Observable<ApiResponse<UserEdit>> {
    return this.http.get<ApiResponse<UserEdit>>(
      `${this.usersUrl}/${userId}`
    );
  }

  updateUser(userId: number, payload: UpdateUserRequest): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(
      `${this.usersUrl}/${userId}`,
      payload
    );
  }

  setUserActive(userId: number, isActive: boolean): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(
      `${this.usersUrl}/${userId}/active`,
      { isActive }
    );
  }

createSupportEmployee(payload: CreateSupportEmployeeRequest): Observable<ApiResponse<number>> {
  return this.http.post<ApiResponse<number>>(
    `${this.usersUrl}/support-employees`,
    payload
  );
}

  getSupportEmployees(): Observable<ApiResponse<EmployeeOption[]>> {
    return this.http.get<ApiResponse<EmployeeOption[]>>(
      `${this.usersUrl}/support-employees`
    );
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

  getActiveProducts() {
    return this.http.get<ApiResponse<ProductOption[]>>(
      `${this.productsUrl}/active`
    );
  }

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  uploadProfileImage(file: File): Observable<ApiResponse<string>> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<ApiResponse<string>>(
      `${this.profileUrl}/image`,
      form
    );
  }

  // =========================
  // Users Counts
  // =========================
uploadUserImage(userId: number, file: File): Observable<ApiResponse<string>> {
  const form = new FormData();
  form.append('file', file);

  return this.http.post<ApiResponse<string>>(
    `${this.usersUrl}/${userId}/image`,
    form
  );
}





  getUsersCounts(): Observable<ApiResponse<UserTicketCount[]>> {
    return this.http.get<ApiResponse<UserTicketCount[]>>(
      `${this.usersUrl}/counts`
    );
  }

  getUsersCountsPaged(q: UsersCountsQuery): Observable<PageResponse<UserTicketCount[]>> {
    let params = new HttpParams()
      .set('pageNumber', q.pageNumber)
      .set('pageSize', q.pageSize);

    const term = q.searchTerm?.trim();
    if (term) params = params.set('searchTerm', term);

    if (q.userType !== undefined && q.userType !== null) {
      params = params.set('userType', String(q.userType));
    }

    if (q.isActive !== undefined && q.isActive !== null) {
      params = params.set('isActive', String(q.isActive));
    }

    return this.http.get<PageResponse<UserTicketCount[]>>(
      `${this.usersUrl}/counts-paged`,
      { params }
    );
  }

  // =========================================================
  // CLIENT CREATE TICKET
  // =========================================================

  createClientTicket(payload: CreateTicketRequest) {
    return this.http.post<ApiResponse<number>>(
      `${this.baseUrl}/client`,
      payload
    );
  }

  // =========================================================
  // ATTACHMENTS (Clean)
  // =========================================================

  getTicketAttachments(ticketId: number): Observable<ApiResponse<TicketAttachment[]>> {
    return this.http.get<ApiResponse<TicketAttachment[]>>(
      `${this.baseUrl}/${ticketId}/attachments`
    );
  }

  uploadTicketAttachment(ticketId: number, file: File): Observable<ApiResponse<TicketAttachment>> {
    const form = new FormData();
    form.append('file', file);

    return this.http.post<ApiResponse<TicketAttachment>>(
      `${this.baseUrl}/${ticketId}/attachments`,
      form
    );
  }

  /**
  
   * DELETE /api/Tickets/{ticketId}/attachments/{attachmentId}
   */
  deleteTicketAttachment(ticketId: number, attachmentId: number) {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.baseUrl}/${ticketId}/attachments/${attachmentId}`
    );
  }

  // =========================================================
  // LOCAL STATE UPDATE (Tickets list)
  // =========================================================

  updateTicketLocally(updater: (list: Ticket[]) => Ticket[]): void {
    const current = this.ticketsSubject.getValue();
    const updated = updater([...current]);
    this.ticketsSubject.next(updated);
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private buildParams(q: TicketQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', q.pageNumber)
      .set('pageSize', q.pageSize);

    const term = q.searchTerm?.trim();
    if (term) params = params.set('searchTerm', term);

    if (q.status !== undefined && q.status !== null && q.status !== '') {
      params = params.set('status', String(q.status));
    }

    const anyQ: any = q;

   if (anyQ.clientId != null && anyQ.clientId !== 0) {
  params = params.set('clientId', String(anyQ.clientId));
}

if (anyQ.assignedEmployeeId != null && anyQ.assignedEmployeeId !== 0) {
  params = params.set('assignedEmployeeId', String(anyQ.assignedEmployeeId));
}

if (anyQ.productId != null && anyQ.productId !== 0) {
  params = params.set('productId', String(anyQ.productId));
}

    return params;
  }

  private handleListResponse(res: PageResponse<Ticket[]>): void {
    this.loadingSubject.next(false);

    if (res.errorCode === 0 && res.data) {
      this.ticketsSubject.next(res.data);
      this.totalCountSubject.next(res.totalCount ?? res.data.length);
      return;
    }

    this.ticketsSubject.next([]);
    this.totalCountSubject.next(0);
    this.errorMessageSubject.next(res.msgError || 'Failed to load tickets.');
  }

  private handleListError(): void {
    this.loadingSubject.next(false);
    this.ticketsSubject.next([]);
    this.totalCountSubject.next(0);
    this.errorMessageSubject.next('Error loading tickets. Please try again.');
  }
}
