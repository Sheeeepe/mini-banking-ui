import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);
  error = signal('');

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.status === 429
          ? 'Troppi tentativi. Riprova tra qualche minuto.'
          : 'Email o password non corretti.'
        );
        this.loading.set(false);
      },
    });
  }

  loginWithGoogle(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.getGoogleAuthUrl().subscribe({
      next: (res) => { window.location.href = res.url; },
      error: () => {
        this.error.set('Impossibile avviare il login con Google.');
        this.loading.set(false);
      },
    });
  }
}
