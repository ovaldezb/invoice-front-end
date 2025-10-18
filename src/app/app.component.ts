import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Global } from './services/Global';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private inactivityMs = Global.INACTIVITY_TIMEOUT_MINUTES;
  private timeoutId: any = null;
  private activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  title = 'invoice-front-end';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.startListeners();
    this.resetTimer();
  }
  
  ngOnDestroy(): void {
    this.stopListeners();
    this.clearTimer();
  }

  private startListeners() {
    this.activityEvents.forEach(evt => window.addEventListener(evt, this.resetTimerBound));
  }

  private stopListeners() {
    this.activityEvents.forEach(evt => window.removeEventListener(evt, this.resetTimerBound));
  }

  private resetTimerBound = () => this.resetTimer();

  private resetTimer() {
    this.clearTimer();
    this.timeoutId = setTimeout(() => this.handleInactivity(), this.inactivityMs);
  }

  private clearTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private async handleInactivity() {
    try {
      await this.authService.logout();
    } catch (e) {
      // ignorar errores de signOut
    }
    
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    const currentPath = this.router.url; // "/factura/123"
    if(currentPath =='/dashboard' || currentPath.includes('dashboard')){
      this.router.navigate(['/login']);
    }else{
      this.router.navigate(['/factura']);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  async beforeUnloadHandler(event: BeforeUnloadEvent) {
  try {
      await this.authService.logout();
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Error during logout on unload', e);
    }
  }
}

