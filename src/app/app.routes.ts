import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./views/home/home').then(m => m.Home) },
    /* { path: 'balance', loadComponent: () => import('./views/balance/balance').then(m => m.Balance) }, */
    /* { path: 'transactions', loadComponent: () => import('./views/transactions/transactions').then(m => m.Transactions) }, */
    { path: '**', loadComponent: () => import('./views/not-found/not-found').then(m => m.NotFound) },
];
