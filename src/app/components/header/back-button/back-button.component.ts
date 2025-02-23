import { CommonModule, Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';

import { ButtonColorScheme } from '@rusbe/components/header/button-color-scheme';

@Component({
  selector: 'rusbe-back-button',
  imports: [CommonModule, NgIconComponent],
  viewProviders: [provideIcons({ lucideChevronLeft })],
  templateUrl: './back-button.component.html',
})
export class BackButtonComponent {
  colorScheme = input<ButtonColorScheme>(ButtonColorScheme.Page);
  customAction = input<(() => boolean) | null>(null);
  ButtonColorScheme = ButtonColorScheme;

  router = inject(Router);
  location = inject(Location);

  goBack() {
    const customAction = this.customAction()?.();
    if (customAction) return;

    if (this.router.lastSuccessfulNavigation?.previousNavigation != null) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
