// src/app/Components/ticket-details/ticket-details.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { TicketDetails } from '../../models/ticket-details';
import { TicketsService } from '../../../services/tickets-service';
import { TicketStatus } from '../../models/ticket-status';
import { TicketsRealtimeService } from '../../../services/tickets-realtime.service';

import { TicketAttachment } from '../../models/ticket-attachment';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../services/AuthService';
import { HasRoleDirective } from '../../../directives/has-role.directive';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective,TranslateModule],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.css'
})
export class TicketDetailsComponent implements OnInit, OnDestroy {

  // =========================
  // Comments
  // =========================
  commentText = '';
  addingComment = false;
  commentError = '';

  // =========================
  // Ticket
  // =========================
  ticket?: TicketDetails;
  loading = false;
  errorMessage = '';

  // expose enum to template
  TicketStatus = TicketStatus;

 private subs = new Subscription();

  private ticketId = 0;

  // =========================
  // Attachments
  // =========================
  attachments: TicketAttachment[] = [];
  attachmentsLoading = false;
  attachmentsError = '';

  selectedFile: File | null = null;
  uploadingAttachment = false;
  uploadSuccess = '';
  uploadError = '';

  deleteSuccess = '';
  deleteError = '';
  deleting: Record<number, boolean> = {};

  maxFileSizeMB = 10;

  private readonly apiHost = environment.apiUrl.replace(/\/api\/?$/i, '');

  // =========================
  // Status Actions UI
  // =========================
  actionLoading = false;
  actionError = '';
  actionSuccess = '';
editingDetails = false;
detailsSaving = false;
detailsError = '';
detailsSuccess = '';

editTitle = '';
editDescription = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketsService: TicketsService,
    private realtime: TicketsRealtimeService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (isNaN(id) || id <= 0) {
      this.errorMessage = 'Invalid ticket id';
      return;
    }

    this.ticketId = id;

    this.loadTicket(id);
    this.loadAttachments(id);

    this.realtime.joinTicket(id).catch(err => console.error(err));

    this.subs.add(
  this.realtime.commentAdded$.subscribe(comment => {
    if (!this.ticket) return;

    const exists = this.ticket.comments?.some(c => c.id === comment.id);
    if (exists) return;

    this.ticket.comments = [...(this.ticket.comments ?? []), comment];
  })
);

// Attachments realtime
this.subs.add(
  this.realtime.attachmentAdded$.subscribe(a => {
    
    const exists = this.attachments.some(x => x.id === a.id);
    if (exists) return;

  
   
  })
);


this.subs.add(
  this.realtime.attachmentDeleted$?.subscribe(attachmentId => {
    this.attachments = this.attachments.filter(x => x.id !== attachmentId);
  }) ?? new Subscription()
);

  }

  ngOnDestroy(): void {
   this.subs.unsubscribe();

if (this.ticketId > 0) {
  this.realtime.leaveTicket(this.ticketId);
}

  }

  // =========================
  // Load Ticket
  // =========================
  loadTicket(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketsService.getTicketDetails(id).subscribe({
      next: t => {
        this.ticket = t;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to load ticket details';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  getStatusBadgeClass(status: TicketStatus) {
    const base = 'badge-status';

    switch (status) {
      case TicketStatus.New:
        return `${base} badge-new`;
      case TicketStatus.InProgress:
        return `${base} badge-inprogress`;
      case TicketStatus.WaitingClient:
        return `${base} badge-waiting`;
  
      case TicketStatus.Closed:
        return `${base} badge-closed`;
      default:
        return `${base} badge-closed`;
    }
  }

  // =========================
  // Comments
  // =========================
  addComment(): void {
    if (!this.ticket) return;

    const text = this.commentText.trim();
    if (!text) {
      this.commentError = 'Comment cannot be empty.';
      return;
    }

    if(this.ticket.status==TicketStatus.Closed)
    {
      this.commentError="the ticket  closed. You cant  comments"
      return;
    }
    this.commentError = '';
    this.addingComment = true;

    this.ticketsService.addComment(this.ticket.id, text).subscribe({
      next: res => {
        this.addingComment = false;

        if (res.errorCode !== 0 || !res.data) {
          this.commentError = res.msgError || 'Failed to add comment.';
          return;
        }

        const exists = this.ticket!.comments?.some(c => c.id === res.data.id);
        if (!exists) {
          this.ticket!.comments = [...(this.ticket!.comments ?? []), res.data];
        }

        this.commentText = '';
      },
      error: () => {
        this.addingComment = false;
        this.commentError = 'Error while adding comment.';
      }
    });
  }

  // =========================
  // Attachments: Load
  // =========================
  loadAttachments(ticketId: number): void {
    this.attachmentsLoading = true;
    this.attachmentsError = '';

    this.ticketsService.getTicketAttachments(ticketId).subscribe({
      next: res => {
        this.attachmentsLoading = false;

        if (res.errorCode === 0 && res.data) {
          this.attachments = [...res.data].sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
          return;
        }

        this.attachments = [];
        this.attachmentsError = res.msgError || 'Failed to load attachments.';
      },
      error: () => {
        this.attachmentsLoading = false;
        this.attachments = [];
        this.attachmentsError = 'Error loading attachments.';
      }
    });
  }

  // =========================
  // Attachments: Select file
  // =========================
  onFileSelected(ev: Event): void {
    this.uploadSuccess = '';
    this.uploadError = '';
    this.deleteSuccess = '';
    this.deleteError = '';
    this.actionSuccess = '';
    this.actionError = '';

    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.selectedFile = null;
      return;
    }

    const maxBytes = this.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.selectedFile = null;
      this.uploadError = `File is too large. Max ${this.maxFileSizeMB}MB.`;
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  // =========================
  // Attachments: Upload
  // =========================
  uploadAttachment(): void {
    if (!this.ticketId || !this.selectedFile) {
      this.uploadError = 'Please choose a file first.';
      return;
    }

    this.uploadingAttachment = true;
    this.uploadSuccess = '';
    this.uploadError = '';
    this.deleteSuccess = '';
    this.deleteError = '';

    this.ticketsService.uploadTicketAttachment(this.ticketId, this.selectedFile).subscribe({
      next: res => {
        this.uploadingAttachment = false;

        if (res.errorCode !== 0 || !res.data) {
          this.uploadError = res.msgError || 'Upload failed.';
          return;
        }

        this.uploadSuccess = 'Attachment uploaded successfully.';
        this.selectedFile = null;

        this.attachments = [res.data, ...this.attachments];
      },
      error: (err) => {
        this.uploadingAttachment = false;
        this.uploadError = err?.error?.msgError || 'Server error while uploading.';
      }
    });
  }

  // =========================
  // Status Actions - Visibility
  // =========================
  canMarkWaitingClient(): boolean {
    return !!this.ticket
      && (this.auth.isEmployee() || this.auth.isManager())
      && this.ticket.status === TicketStatus.InProgress;
  }

  canConfirmFix(): boolean {
    return !!this.ticket
      && this.auth.isClient()
      && this.ticket.status === TicketStatus.WaitingClient;
  }

  canRejectFix(): boolean {
    return this.canConfirmFix();
  }

  // =========================
  // Status Actions - Calls
  // =========================
  markWaitingClient(): void {
    if (!this.ticket) return;

    this.actionLoading = true;
    this.actionError = '';
    this.actionSuccess = '';

    this.ticketsService.markWaitingClient(this.ticket.id).subscribe({
      next: res => {
        this.actionLoading = false;

        if (res.errorCode !== 0 || !res.data) {
          this.actionError = res.msgError || 'Failed to update status.';
          return;
        }

        this.ticket!.status = TicketStatus.WaitingClient;
        this.actionSuccess = 'Ticket is now waiting for client confirmation.';
      },
      error: err => {
        this.actionLoading = false;
        this.actionError = err?.error?.msgError || 'Server error.';
      }
    });
  }

  clientDecision(action: 'confirm' | 'reject'): void {
  if (!this.ticket) return;

  this.actionLoading = true;
  this.actionError = '';
  this.actionSuccess = '';

  this.ticketsService.clientDecision(this.ticket.id, action).subscribe({
    next: res => {
      this.actionLoading = false;

      if (res.errorCode !== 0 || !res.data) {
        this.actionError = res.msgError || 'Failed to update ticket.';
        return;
      }

      if (action === 'confirm') {
        this.ticket!.status = TicketStatus.Closed;
        this.actionSuccess = 'Thanks! Ticket has been closed.';
      } else {
        this.ticket!.status = TicketStatus.InProgress;
        this.actionSuccess = 'Ticket is back in progress.';
      }
    },
    error: err => {
      this.actionLoading = false;
      this.actionError = err?.error?.msgError || 'Server error.';
    }
  });
}

canEditDetails(): boolean {
  if(this.ticket?.status==TicketStatus.New)
    return true;
  else
    return false;

}

startEdit(): void {
  if (!this.ticket) return;

  this.detailsError = '';
  this.detailsSuccess = '';

  this.editTitle = this.ticket.title ?? '';
  this.editDescription = this.ticket.description ?? '';
  this.editingDetails = true;
}

cancelEdit(): void {
  this.editingDetails = false;
  this.detailsError = '';
  this.detailsSuccess = '';
}

saveDetails(): void {
  if (!this.ticket) return;

  const title = (this.editTitle ?? '').trim();
  const desc = (this.editDescription ?? '').trim();

  if (!title) {
    this.detailsError = 'Title is required.';
    return;
  }

  this.detailsSaving = true;
  this.detailsError = '';
  this.detailsSuccess = '';

  this.ticketsService.updateTicketDetails(this.ticket.id, {
    title,
    description: desc
  }).subscribe({
    next: (res) => {
      this.detailsSaving = false;

      if (res.errorCode !== 0 || !res.data) {
        this.detailsError = res.msgError || 'Failed to update.';
       
        return;
      }

     
      this.ticket!.title = res.data.title;
      this.ticket!.description = res.data.description;

      this.editingDetails = false;
      this.detailsSuccess = 'Ticket details updated.';
    },
    error: (err) => {
      this.detailsSaving = false;
      this.detailsError = err?.error?.msgError || 'Server error.';
    
      
    }
  });
}

  // =========================
  // Attachments: Delete (Owner only UI)
  // =========================
  canDeleteAttachment(a: TicketAttachment): boolean {
    const myId = this.auth.getUserId?.();
    return !!myId && a.uploadedByUserId === myId;
  }

  deleteAttachment(a: TicketAttachment): void {
    if (!a || !this.canDeleteAttachment(a)) return;
    if (this.deleting[a.id]) return;

    this.deleteSuccess = '';
    this.deleteError = '';
    this.attachmentsError = '';

    this.deleting[a.id] = true;

    this.ticketsService.deleteTicketAttachment(this.ticketId, a.id)
      .subscribe({
        next: res => {
          this.deleting[a.id] = false;

          if (res.errorCode !== 0 || !res.data) {
            this.deleteError = res.msgError || 'Delete failed.';
            return;
          }

          this.attachments = this.attachments.filter(x => x.id !== a.id);
          this.deleteSuccess = 'Attachment deleted.';
        },
        error: (err) => {
          this.deleting[a.id] = false;
          this.deleteError = err?.error?.msgError || 'Server error while deleting.';
        }
      });
  }

  // =========================
  // Helpers
  // =========================
  getAttachmentUrl(a: TicketAttachment): string {
    if (!a.filePath) return '';

    if (/^https?:\/\//i.test(a.filePath)) return a.filePath;

    return `${this.apiHost}${a.filePath}`;
  }

  formatSize(bytes: number): string {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;

    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;

    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }
}
