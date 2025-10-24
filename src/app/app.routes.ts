import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '', redirectTo: '/factura',  pathMatch: 'full'
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'verifica-usuario',
    loadComponent: () => import('./components/verifica-usuario/verifica-usuario.component').then(m => m.VerificaUsuarioComponent)
  },
  { 
    path: 'factura', 
    loadComponent: () => import('./components/genera-factura/genera-factura.component').then(m => m.GeneraFacturaComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/factura'
  }
];
