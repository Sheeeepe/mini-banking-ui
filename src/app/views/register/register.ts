import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './register.html',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
  loading = signal(false);
  error = signal('');

  submit(): void {
    if (!this.email || !this.password || !this.confirmPassword) return;

    if (this.password.length < 8) {
      this.error.set('La password deve essere di almeno 8 caratteri.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Le password non coincidono.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.register(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.status === 409
          ? 'Esiste già un account con questa email.'
          : err.error?.error ?? 'Registrazione fallita. Riprova.'
        );
        this.loading.set(false);
      },
    });
  }
}
