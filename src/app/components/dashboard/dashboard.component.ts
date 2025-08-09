import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  givenName: string = '';
  familyName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    
  }
  ngOnInit(): void {
    this.authService.getCurrentUser().then(user => {
      this.givenName = user.tokens.idToken.payload.given_name;
      this.familyName = user.tokens.idToken.payload.family_name;
    }).catch(error => {
      console.error('Error al obtener el usuario actual:', error);
      this.router.navigate(['/login']);
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error en logout:', error);
      }
    });
  }
}
