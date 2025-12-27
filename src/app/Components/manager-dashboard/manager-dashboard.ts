import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { DashboardService } from '../../../services/dashboard-service';
import { DashboardSummary } from '../../models/dashboard-summary';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [NgIf, NgFor,TranslateModule],
  templateUrl: './manager-dashboard.html',
  styleUrl: './manager-dashboard.css',
})
export class ManagerDashboardComponent implements OnInit {

  loading = false;
  errorMessage = '';

  data: DashboardSummary | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.load();
  }
resolveImage(url?: string | null): string | null {
  const u = (url ?? '').trim();
  if (!u) return null;

 
  if (/^https?:\/\//i.test(u)) return u;

 
  const root = (environment.apiUrl || '').replace(/\/api\/?$/i, '');

  const slash = u.startsWith('/') ? '' : '/';
  return `${root}${slash}${u}`;
}
  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getManagerSummary().subscribe({
      next: (res) => {
        this.loading = false;

        if (res.errorCode === 0 && res.data) {
          this.data = res.data;
          return;
        }

        this.data = null;
        this.errorMessage = res.msgError || 'Failed to load dashboard.';
      },
      error: () => {
        this.loading = false;
        this.data = null;
        this.errorMessage = 'Error loading dashboard. Please try again.';
      }
    });
  }

  // ---------- UI helpers ----------
  getCount(key: string): number {
    return this.data?.statusCounts?.[key] ?? 0;
  }

  get totalTickets(): number {
    const obj = this.data?.statusCounts ?? {};
    return Object.values(obj).reduce((a, b) => a + (b ?? 0), 0);
  }

  // bar width %
  percent(count: number): number {
    const total = this.totalTickets;
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }

  // trend max for scaling
  get trendMax(): number {
    const t = this.data?.trend ?? [];
    const m = Math.max(0, ...t.map(x => x.count ?? 0));
    return m || 1;
  }

  trendHeight(count: number): number {
    const max = this.trendMax;
    return Math.round((count / max) * 100);
  }
}
