import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/AuthService';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private allowedRoles: string[] = [];

  @Input('appHasRole')
  set roles(value: string[] | string) {
    this.allowedRoles = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor(
    private auth: AuthService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  private updateView(): void {
    this.viewContainer.clear();

    const role = this.auth.getRole();
    if (!role) return;

    if (this.allowedRoles.includes(role)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
