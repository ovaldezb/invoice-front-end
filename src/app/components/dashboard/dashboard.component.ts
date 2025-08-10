import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfiguraCsdComponent } from '../configura-csd/configura-csd.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ConfiguraCsdComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  givenName: string = '';
  familyName: string = '';
  activeTab: string = 'tab1';

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
