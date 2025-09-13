import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { VerificaUsuarioComponent } from './components/verifica-usuario/verifica-usuario.component';
import { GeneraFacturaComponent } from './components/genera-factura/genera-factura.component';

export const routes: Routes = [
  {
    path: '', redirectTo: '/factura',  pathMatch: 'full'
  },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'verifica-usuario',component: VerificaUsuarioComponent },
  { path: 'factura', component:GeneraFacturaComponent},
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
