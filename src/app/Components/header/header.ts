import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/AuthService';
import { Observable } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive,TranslateModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit {
private readonly LANG_KEY = 'lang';

  state$!: Observable<any>;
 private translate = inject(TranslateService);

toggleLang(): void {
  const current = (this.translate.currentLang as 'en' | 'ar')
    || (localStorage.getItem(this.LANG_KEY) as 'en' | 'ar')
    || 'en';

  const next: 'en' | 'ar' = current === 'en' ? 'ar' : 'en';
  this.applyLang(next);
}
  constructor(private auth: AuthService, private router: Router) {
    this.state$ = this.auth.state$;
  }
  private applyLang(lang: 'en' | 'ar'): void {
  this.translate.use(lang);
  localStorage.setItem(this.LANG_KEY, lang);


  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}
  ngOnInit(): void {
      const saved = (localStorage.getItem(this.LANG_KEY) as 'en' | 'ar') || 'en';
     this.applyLang(saved);

  }

 goLogin(): void {
  this.router.navigate(['/login'], { 
    queryParams: { r: Date.now() },
    replaceUrl: true
  });
}


logout(): void {
  this.auth.logout(); 
  this.router.navigate(['/login'], { 
    queryParams: { r: Date.now() },
    replaceUrl: true
  });
}
}
