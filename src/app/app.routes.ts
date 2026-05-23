import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',        loadComponent: () => import('./views/home/home').then(m => m.Home) },
  { path: 'accounts',   loadComponent: () => import('./views/accounts/accounts').then(m => m.Accounts) },
  { path: 'accounts/:id', loadComponent: () => import('./views/account-dashboard/account-dashboard').then(m => m.AccountDashboard) },
  { path: 'accounts/:id/deposit',  loadComponent: () => import('./views/transaction-form/transaction-form').then(m => m.TransactionForm), data: { type: 'deposit' } },
  { path: 'accounts/:id/withdraw', loadComponent: () => import('./views/transaction-form/transaction-form').then(m => m.TransactionForm), data: { type: 'withdraw' } },
  { path: 'accounts/:id/transfer', loadComponent: () => import('./views/transfer-form/transfer-form').then(m => m.TransferForm) },
  { path: 'accounts/:id/transactions',      loadComponent: () => import('./views/transactions/transactions').then(m => m.Transactions) },
  { path: 'accounts/:id/transactions/:tid', loadComponent: () => import('./views/transaction-detail/transaction-detail').then(m => m.TransactionDetail) },
  { path: '**', loadComponent: () => import('./views/not-found/not-found').then(m => m.NotFound) },
];
