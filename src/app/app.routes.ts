import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public auth routes
  { path: 'login',    loadComponent: () => import('./views/login/login').then(m => m.Login),       canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./views/register/register').then(m => m.Register), canActivate: [guestGuard] },
  { path: 'auth/google/callback', loadComponent: () => import('./views/google-callback/google-callback').then(m => m.GoogleCallback) },

  // Protected routes
  { path: 'home',     loadComponent: () => import('./views/home/home').then(m => m.Home),          canActivate: [authGuard] },
  { path: 'accounts', loadComponent: () => import('./views/accounts/accounts').then(m => m.Accounts), canActivate: [authGuard] },
  { path: 'accounts/:id',
    loadComponent: () => import('./views/account-dashboard/account-dashboard').then(m => m.AccountDashboard),
    canActivate: [authGuard] },
  { path: 'accounts/:id/deposit',
    loadComponent: () => import('./views/transaction-form/transaction-form').then(m => m.TransactionForm),
    data: { type: 'deposit' }, canActivate: [authGuard] },
  { path: 'accounts/:id/withdraw',
    loadComponent: () => import('./views/transaction-form/transaction-form').then(m => m.TransactionForm),
    data: { type: 'withdraw' }, canActivate: [authGuard] },
  { path: 'accounts/:id/transactions',
    loadComponent: () => import('./views/transactions/transactions').then(m => m.Transactions),
    canActivate: [authGuard] },
  { path: 'accounts/:id/transactions/:tid',
    loadComponent: () => import('./views/transaction-detail/transaction-detail').then(m => m.TransactionDetail),
    canActivate: [authGuard] },

  { path: '**', loadComponent: () => import('./views/not-found/not-found').then(m => m.NotFound) },
];
