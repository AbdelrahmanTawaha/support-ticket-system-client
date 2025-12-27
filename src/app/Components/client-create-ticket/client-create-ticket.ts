import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketsService } from '../../../services/tickets-service';
import { CreateTicketRequest } from '../../models/create-ticket-request';
import { ProductOption } from '../../models/product-option';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-client-create-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule,TranslateModule],
  templateUrl: './client-create-ticket.html',
  styleUrl: './client-create-ticket.css',
})
export class ClientCreateTicketComponent implements OnInit  {
selectedFiles: File[] = [];

  title = '';
  description = '';
  productId = 0;
products: ProductOption[] = [];

  loading = false;
  error = '';

  constructor(
    private ticketsService: TicketsService,
    private router: Router
  ) {}
  ngOnInit(): void {
     this.loadProducts();
  }

  submit(): void {
  this.error = '';

  if (!this.title.trim()) {
    this.error = 'Title is required.';
    return;
  }

  if (this.productId <= 0) {
    this.error = 'Please select a product.';
    return;
  }

  const payload: CreateTicketRequest = {
    title: this.title.trim(),
    description: this.description?.trim(),
    productId: this.productId
  };

  this.loading = true;

  this.ticketsService.createClientTicket(payload).subscribe({
    next: (res) => {
      if (res.errorCode !== 0) {
        this.loading = false;
        this.error = res.msgError || 'Failed to create ticket.';
        return;
      }

      const newId = res.data as number;

      // ✅ إذا ما في ملفات: روح مباشرة
      if (!this.selectedFiles.length) {
        this.loading = false;
        this.router.navigate(['/tickets', newId]);
        return;
      }

      // ✅ ارفع الملفات واحد واحد (سهل وبسيط)
      this.uploadSelectedFiles(newId);
    },
    error: () => {
      this.loading = false;
      this.error = 'Server error. Please try again.';
    }
  });
}

private uploadSelectedFiles(ticketId: number): void {
  const files = [...this.selectedFiles];

  const uploadNext = (i: number) => {
    if (i >= files.length) {
      this.loading = false;
      this.router.navigate(['/tickets', ticketId]);
      return;
    }

    this.ticketsService.uploadTicketAttachment(ticketId, files[i]).subscribe({
      next: (r) => {
        if (r.errorCode !== 0) {
         
          this.loading = false;
          this.error = r.msgError || `Failed to upload: ${files[i].name}`;
          return;
        }

        uploadNext(i + 1);
      },
      error: () => {
        this.loading = false;
        this.error = `Upload failed: ${files[i].name}`;
      }
    });
  };

  uploadNext(0);
}


  cancel(): void {
    this.router.navigate(['/client']);
  }
  private loadProducts(): void {
  this.ticketsService.getActiveProducts().subscribe({
    next: (res) => {
      if (res.errorCode === 0 && res.data) {
        this.products = res.data;
        
        if (this.products.length > 0 && this.productId <= 0) {
          this.productId = this.products[0].id;
        }
      }
    },
    error: () => {
     
    }
  });
}
onFilesSelected(ev: Event): void {
  const input = ev.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  this.selectedFiles = files;

  input.value = '';
}

removeFile(index: number): void {
  this.selectedFiles.splice(index, 1);
}

formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

}
