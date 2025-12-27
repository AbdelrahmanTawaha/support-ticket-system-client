import { Routes } from '@angular/router';

import { authGuard } from '../guards/auth-guard';
import { roleGuard } from '../guards/role-guard';

export const routes: Routes = [

  // =========================
  // Public
  // =========================
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./Components/login/login').then(m => m.Login)
  },
  {
    path: 'register-client',
    loadComponent: () => import('./Components/register-client/register-client')
      .then(m => m.RegisterClientComponent)
  },
  //  Forgot/Reset Password (Public)
  {
    path: 'forgot-password',
    loadComponent: () => import('./Components/forgot-password/forgot-password')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./Components/reset-password/reset-password')
      .then(m => m.ResetPasswordComponent)
  },

  // =========================
  // Admin (SupportManager)
  // =========================

  //  Dashboard
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./Components/manager-dashboard/manager-dashboard')
      .then(m => m.ManagerDashboardComponent),
    canActivate: [authGuard, roleGuard(['SupportManager'])]
  },

  //  Tickets list
  {
    path: 'tickets',
    loadComponent: () => import('./Components/tickets-list/tickets-list')
      .then(m => m.TicketsList),
    canActivate: [authGuard, roleGuard(['SupportManager'])]
  },

  // Users overview
  {
    path: 'admin/users-counts',
    loadComponent: () => import('./Components/users-counts/users-counts')
      .then(m => m.UsersCountsComponent),
    canActivate: [authGuard, roleGuard(['SupportManager'])]
  },

  // =========================
  // Employee
  // =========================
  {
    path: 'employee',
    loadComponent: () => import('./Components/employee/employee')
      .then(m => m.EmployeeTicketsComponent),
    canActivate: [authGuard, roleGuard(['SupportEmployee'])]
  },

  // =========================
  // Client
  // =========================
  {
    path: 'client',
    loadComponent: () => import('./Components/client/client')
      .then(m => m.ClientTicketsComponent),
    canActivate: [authGuard, roleGuard(['ExternalClient'])]
  },
  {
    path: 'client/tickets/create',
    loadComponent: () => import('./Components/client-create-ticket/client-create-ticket')
      .then(m => m.ClientCreateTicketComponent),
    canActivate: [authGuard, roleGuard(['ExternalClient'])]
  },

  // =========================
  // Details
  // =========================
  {
    path: 'admin/add-employee',
    loadComponent: () => import('./Components/add-support-employee/add-support-employee')
      .then(m => m.AddSupportEmployeeComponent),
    canActivate: [authGuard, roleGuard(['SupportManager'])]
  },
  {
    path: 'tickets/:id',
    loadComponent: () => import('./Components/ticket-details/ticket-details')
      .then(m => m.TicketDetailsComponent),
    canActivate: [
      authGuard,
      roleGuard(['SupportManager', 'SupportEmployee', 'ExternalClient'])
    ]
  },

  // =========================
  // Fallback
  // =========================
  { path: '**', redirectTo: '' }
];
