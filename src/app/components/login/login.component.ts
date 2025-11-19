import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Global } from '../../services/Global';
import { EnvironmentService } from '../../services/environment.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';
  public Global = Global;
  backEndEnv: string = '';
  private returnUrl: string = '/dashboard';
  
  constructor(
    private authService: AuthService,
    private environmentService: EnvironmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener la URL de retorno si existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.getEnvironment();
  }

  onLogin(): void {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.authService.getCurrentUser().then(user => {
          // Redirigir a la URL guardada o al dashboard por defecto
          this.router.navigate([this.returnUrl], { replaceUrl: true });
        }).catch(error => {
          console.error('Error al obtener el usuario actual:', error);
          this.loading = false;
          // Aunque haya error, si el login fue exitoso, redirigir
          this.router.navigate([this.returnUrl], { replaceUrl: true });
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Error en el inicio de sesión';
        console.error('Error en login:', error);
      }
    });
  }

  getEnvironment():void{
    this.environmentService.getEnvironment()
    .subscribe({
      next: (response:HttpResponse<any>) => {      
          this.backEndEnv = response.body.environment || '';
      },
      error: (error) => {
        console.error(error);
      }
    }); 
  }

  onLogout(): void {
    this.loading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en logout:', error);
        // Redirigir al login incluso si hay error
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }
}
