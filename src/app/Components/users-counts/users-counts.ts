import { Component, OnInit } from '@angular/core';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserTicketCount } from '../../models/user-ticket-count';
import { TicketsService } from '../../../services/tickets-service';
import { PageResponse } from '../../models/ApiResponse';
import { UserEdit } from '../../models/user-edit';
import { UpdateUserRequest } from '../../models/user-update-request';

import { HasRoleDirective } from '../../../directives/has-role.directive';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

type ActiveFilter = 'All' | 'Active' | 'Inactive';
type TypeFilter =
  | 'All'
  | 'SupportManager'
  | 'SupportEmployee'
  | 'ExternalClient'
  | 'Manager'
  | 'Employee'
  | 'Client'
  | string;

const USER_TYPE_MAP: Record<number, string> = {
  0: 'SupportManager',
  1: 'SupportEmployee',
  2: 'ExternalClient',
};

@Component({
  selector: 'app-users-counts',
  standalone: true,
  imports: [NgForOf, NgIf, NgClass, FormsModule, HasRoleDirective, TranslateModule],
  templateUrl: './users-counts.html',
  styleUrl: './users-counts.css',
})
export class UsersCountsComponent implements OnInit {

  // ===== Data =====
  users: UserTicketCount[] = [];
  filtered: UserTicketCount[] = [];

  // ===== Paging =====
  pageNumber = 1;
  pageSize = 9;
  totalCount = 0;

  get totalPages(): number {
    const n = Math.ceil((this.totalCount || 0) / this.pageSize);
    return n <= 0 ? 1 : n;
  }

  // ===== UI State =====
  loading = false;
  errorMessage = '';

  // ===== Filters =====
  searchTerm = '';
  typeFilter: TypeFilter = 'All';
  activeFilter: ActiveFilter = 'All';

  // ===== Per-user request state =====
  toggling: Record<number, boolean> = {};

  // =========================
  // EDIT STATE
  // =========================
  editOpen = false;
  editLoading = false;
  editSaving = false;
  editError = '';

  selectedUserId: number | null = null;

  editModel: UserEdit = {
    id: 0,
    fullName: '',
    email: '',
    phoneNumber: '',
    address: null,
    dateOfBirth: null,
    imageUrl: null,
    userType: 0,
    isActive: true
  };

  // =========================
  //  Image upload state
  // =========================
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(private ticketsService: TicketsService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // =========================
  // Load (SERVER-SIDE PAGED)
  // =========================
  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    const userType = this.mapTypeFilterToApiValue(this.typeFilter);
    const isActive = this.mapActiveFilterToApiValue(this.activeFilter);
    const term = this.searchTerm.trim();

    this.ticketsService.getUsersCountsPaged({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: term || undefined,
      userType,
      isActive
    }).subscribe({
      next: (res: PageResponse<UserTicketCount[]>) => {
        this.loading = false;

        if (res.errorCode === 0 && res.data) {
          this.users = res.data;
          this.filtered = res.data;
          this.totalCount = res.totalCount ?? res.data.length;

          if (this.pageNumber > this.totalPages) {
            this.pageNumber = this.totalPages;
          }

          return;
        }

        this.users = [];
        this.filtered = [];
        this.totalCount = 0;
        this.errorMessage = res.msgError || 'Failed to load users.';
      },
      error: () => {
        this.loading = false;
        this.users = [];
        this.filtered = [];
        this.totalCount = 0;
        this.errorMessage = 'Error loading users. Please try again.';
      },
    });
  }

  // =========================
  // Filters
  // =========================
  onSearchChange(): void {
    this.pageNumber = 1;
    this.loadUsers();
  }

  onTypeChange(): void {
    this.pageNumber = 1;
    this.loadUsers();
  }

  onActiveChange(): void {
    this.pageNumber = 1;
    this.loadUsers();
  }

  // =========================
  // Pagination actions
  // =========================
  nextPage(): void {
    if (this.pageNumber >= this.totalPages) return;
    this.pageNumber++;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.pageNumber <= 1) return;
    this.pageNumber--;
    this.loadUsers();
  }

  // =========================
  // Activate / Deactivate
  // =========================
  toggleActive(user: UserTicketCount): void {
    if (!user) return;
    if (this.toggling[user.id]) return;

    const newValue = !user.isActive;
    this.toggling[user.id] = true;

    this.ticketsService.setUserActive(user.id, newValue).subscribe({
      next: (res: any) => {
        this.toggling[user.id] = false;

        if (res.errorCode !== 0 || !res.data) return;

        this.users = this.users.map(u =>
          u.id === user.id ? { ...u, isActive: newValue } : u
        );
        this.filtered = this.users;
      },
      error: () => {
        this.toggling[user.id] = false;
      },
    });
  }

  // =========================
  //  EDIT FLOW
  // =========================
  openEdit(user: UserTicketCount): void {
    if (!user) return;

    this.editOpen = true;
    this.editLoading = true;
    this.editSaving = false;
    this.editError = '';
    this.selectedUserId = user.id;

    // reset image state
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;

    this.ticketsService.getUserForEdit(user.id).subscribe({
      next: (res: any) => {
        this.editLoading = false;

        if (res.errorCode === 0 && res.data) {
          this.editModel = {
            id: res.data.id,
            fullName: res.data.fullName ?? '',
            email: res.data.email ?? '',
            phoneNumber: res.data.phoneNumber ?? '',
            address: res.data.address ?? null,
            imageUrl: res.data.imageUrl ?? null,
            dateOfBirth: res.data.dateOfBirth ?? null,
            userType: res.data.userType,
            isActive: res.data.isActive
          };

         
          this.imagePreviewUrl = this.editModel.imageUrl ?? null;
          return;
        }

        this.editError = res.msgError || 'Failed to load user.';
      },
      error: () => {
        this.editLoading = false;
        this.editError = 'Error loading user data.';
      }
    });
  }

  closeEdit(): void {
    this.editOpen = false;
    this.editLoading = false;
    this.editSaving = false;
    this.editError = '';
    this.selectedUserId = null;

    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }

  // =========================
  // Image selection handler
  // =========================
  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      this.selectedImageFile = null;
      this.imagePreviewUrl = this.editModel.imageUrl ?? null;
      return;
    }

   
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.editError = 'Invalid image type.';
      this.selectedImageFile = null;
      input.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.editError = 'Image is too large.';
      this.selectedImageFile = null;
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    this.editError = '';

 
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }


saveEdit(): void {
  const userId = this.selectedUserId;
  if (userId == null) return;

  const payload: UpdateUserRequest = {
    fullName: this.editModel.fullName?.trim() ?? '',
    email: this.editModel.email?.trim() ?? '',
    phoneNumber: this.editModel.phoneNumber?.trim() ?? '',
    address: this.editModel.address?.trim() ?? null,
    dateOfBirth: this.editModel.dateOfBirth ?? null
  };

  if (!payload.fullName || !payload.email || !payload.phoneNumber) {
    this.editError = 'Full name, email and phone are required.';
    return;
  }

  this.editSaving = true;
  this.editError = '';

  this.ticketsService.updateUser(userId, payload).subscribe({
    next: (res: any) => {
      if (res.errorCode !== 0 || !res.data) {
        this.editSaving = false;
        this.editError = res.msgError || 'Failed to update user.';
        return;
      }

     
      this.users = this.users.map(u =>
        u.id === userId ? { ...u, name: payload.fullName } : u
      );
      this.filtered = this.users;

     
      if (!this.selectedImageFile) {
        this.editSaving = false;
        this.closeEdit();
        return;
      }

    
      this.ticketsService.uploadUserImage(userId, this.selectedImageFile).subscribe({
        next: (imgRes: any) => {
          this.editSaving = false;

          if (imgRes.errorCode !== 0 || !imgRes.data) {
            this.editError = imgRes.msgError || 'Image upload failed.';
            return;
          }

          const newImage = imgRes.data as string; 

         
          this.users = this.users.map(u =>
            u.id === userId
              ? { ...u, name: payload.fullName, imageUrl: newImage }
              : u
          );
          this.filtered = this.users;

        
          this.editModel.imageUrl = newImage;
          this.imagePreviewUrl = newImage;

          this.closeEdit();
        },
        error: () => {
          this.editSaving = false;
          this.editError = 'Error uploading image.';
        }
      });
    },
    error: () => {
      this.editSaving = false;
      this.editError = 'Error saving changes.';
    }
  });
}

resolveImage(url?: string | null): string | null {
  const u = (url ?? '').trim();
  if (!u) return null;

 
  if (/^https?:\/\//i.test(u)) return u;

 
  const root = (environment.apiUrl || '').replace(/\/api\/?$/i, '');

  const slash = u.startsWith('/') ? '' : '/';
  return `${root}${slash}${u}`;
}


  // =========================
  // Type helpers
  // =========================
  getTypeLabel(type: number): string {
    return USER_TYPE_MAP[type] ?? `Type ${type}`;
  }

  getTypeClass(type: number): string {
    const label = this.getTypeLabel(type).toLowerCase();
    if (label.includes('manager')) return 'type-manager';
    if (label.includes('employee')) return 'type-employee';
    if (label.includes('client')) return 'type-client';
    return 'type-other';
  }

  // =========================
  // Mapping filters -> API params
  // =========================
  private mapTypeFilterToApiValue(filter: string): number | null {
    switch (filter) {
      case 'SupportManager':
      case 'Manager':
        return 0;
      case 'SupportEmployee':
      case 'Employee':
        return 1;
      case 'ExternalClient':
      case 'Client':
        return 2;
      case 'All':
      default:
        return null;
    }
  }

  private mapActiveFilterToApiValue(filter: ActiveFilter): boolean | null {
    if (filter === 'Active') return true;
    if (filter === 'Inactive') return false;
    return null;
  }

  // =========================
  // UI Helpers
  // =========================
  getAvatarLetter(name?: string | null): string {
    const n = (name ?? '').trim();
    return n ? n.charAt(0).toUpperCase() : 'U';
  }

  trackById(_: number, item: UserTicketCount): number {
    return item.id;
  }
}
