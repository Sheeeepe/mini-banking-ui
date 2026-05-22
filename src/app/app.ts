import { Component, inject, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Navbar } from './shared/navbar/navbar';
import { Sidebar } from './shared/sidebar/sidebar';

const AUTH_PATHS = ['/login', '/register', '/auth/google/callback'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  @ViewChild('sidebar') sidebarRef?: Sidebar;

  isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  isAuthPage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => AUTH_PATHS.some(p => this.router.url.startsWith(p)))
    ),
    { initialValue: AUTH_PATHS.some(p => location.pathname.startsWith(p)) }
  );

  toggleSidebar(): void {
    this.sidebarRef?.toggle();
  }
}
