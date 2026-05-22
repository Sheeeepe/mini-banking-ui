import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-google-callback',
  imports: [MatIconModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      @if (errorMsg) {
        <div class="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-sm">
          <mat-icon class="text-red-400 mb-4" style="font-size: 48px; width: 48px; height: 48px;">error_outline</mat-icon>
          <p class="text-gray-700 font-medium mb-1">Accesso con Google fallito</p>
          <p class="text-gray-500 text-sm mb-6">{{ errorMsg }}</p>
          <a href="/login" class="text-indigo-600 text-sm font-semibold hover:underline">Torna al login</a>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p class="text-gray-500 text-sm">Completamento accesso con Google...</p>
        </div>
      }
    </div>
  `,
})
export class GoogleCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMsg = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.saveGoogleToken(token);
      this.router.navigate(['/home']);
    } else {
      this.errorMsg = this.route.snapshot.queryParamMap.get('error')
        ?? 'Nessun token ricevuto dal server.';
    }
  }
}
