// src/services/tickets-realtime.service.ts

import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { AuthService } from './AuthService';
import { TicketComment } from '../app/models/ticket-comment';
import { TicketAttachment } from '../app/models/ticket-attachment';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketsRealtimeService {

  private hub?: signalR.HubConnection;
  private isStarting = false;

  private lastTicketId: number | null = null;

  // =========================
  // Events
  // =========================

  private commentAddedSubject = new Subject<TicketComment>();
  readonly commentAdded$ = this.commentAddedSubject.asObservable();

  private attachmentAddedSubject = new Subject<TicketAttachment>();
  readonly attachmentAdded$ = this.attachmentAddedSubject.asObservable();


  private attachmentDeletedSubject = new Subject<number>();
  readonly attachmentDeleted$ = this.attachmentDeletedSubject.asObservable();

  constructor(private auth: AuthService) {}

  // =========================
  // Hub URL
  // =========================
  private get hubUrl(): string {
    return environment.hubUrl; // https://localhost:7266/hubs/tickets
  }

  // =========================
  // Build Hub (once)
  // =========================
  private buildHub(): void {
    if (this.hub) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.auth.getToken() ?? ''
      })
      .withAutomaticReconnect()
      .build();


    this.hub.on('CommentAdded', (comment: TicketComment) => {
      this.commentAddedSubject.next(comment);
    });

   
    this.hub.on('AttachmentAdded', (a: TicketAttachment) => {
      this.attachmentAddedSubject.next(a);
    });

 
    this.hub.on('AttachmentDeleted', (attachmentId: number) => {
      this.attachmentDeletedSubject.next(attachmentId);
    });

  
    this.hub.onreconnected(async () => {
      if (!this.lastTicketId) return;
      try {
        await this.hub!.invoke('JoinTicket', this.lastTicketId);
      } catch {}
    });
  }

  // =========================
  // Ensure Connected
  // =========================
  private async ensureConnected(): Promise<void> {
    this.buildHub();
    if (!this.hub) return;

    if (this.hub.state === signalR.HubConnectionState.Connected) return;

    const token = this.auth.getToken();
    if (!token) return; 

    if (this.isStarting) return;

    this.isStarting = true;
    try {
      await this.hub.start();
    } catch {
      
    } finally {
      this.isStarting = false;
    }
  }

  // =========================
  // Public API
  // =========================

  async joinTicket(ticketId: number): Promise<void> {
    this.lastTicketId = ticketId;

    await this.ensureConnected();
    if (!this.hub) return;

    if (this.hub.state !== signalR.HubConnectionState.Connected) return;

    try {
      await this.hub.invoke('JoinTicket', ticketId);
    } catch {}
  }

  async leaveTicket(ticketId: number): Promise<void> {
    if (this.lastTicketId === ticketId) {
      this.lastTicketId = null;
    }

    if (!this.hub) return;

    try {
      await this.hub.invoke('LeaveTicket', ticketId);
    } catch {}
  }

  async disconnect(): Promise<void> {
    this.lastTicketId = null;

    if (!this.hub) return;

    try {
      await this.hub.stop();
    } finally {
      this.hub = undefined;
    }
  }

 
  isConnected(): boolean {
    return this.hub?.state === signalR.HubConnectionState.Connected;
  }
}
