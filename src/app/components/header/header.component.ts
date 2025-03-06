import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { BackButtonComponent } from '@rusbe/components/header/back-button/back-button.component';
import { ButtonColorScheme } from '@rusbe/components/header/button-color-scheme';
import { CloseButtonComponent } from '@rusbe/components/header/close-button/close-button.component';
import { LogoComponent } from '@rusbe/components/logo/logo.component';
import { UserAccountButtonComponent } from '@rusbe/components/user-account-button/user-account-button.component';

@Component({
  selector: 'rusbe-header',
  imports: [
    CommonModule,
    LogoComponent,
    BackButtonComponent,
    UserAccountButtonComponent,
    CloseButtonComponent,
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  HeaderType = HeaderType;

  type = input<HeaderType>(HeaderType.LogoWithUserAccountButton);
  customAction = input<(() => boolean) | null>(null);

  readonly buttonColorSchemeMap: Partial<
    Record<HeaderType, ButtonColorScheme>
  > = {
    [HeaderType.PageNameWithBackButton]: ButtonColorScheme.Page,
    [HeaderType.PageNameWithCloseButton]: ButtonColorScheme.Page,
    [HeaderType.PageNameWithBackButtonOnColoredBackground]:
      ButtonColorScheme.ColoredBackground,
  };

  hasBackButton = computed(() =>
    [
      HeaderType.PageNameWithBackButton,
      HeaderType.PageNameWithBackButtonOnColoredBackground,
    ].includes(this.type()),
  );

  hasCloseButton = computed(
    () => this.type() === HeaderType.PageNameWithCloseButton,
  );

  hasUserAccountButton = computed(
    () => this.type() === HeaderType.LogoWithUserAccountButton,
  );
  hasLogo = computed(() =>
    [HeaderType.LogoOnly, HeaderType.LogoWithUserAccountButton].includes(
      this.type(),
    ),
  );

  hasPageName = computed(() =>
    [
      HeaderType.PageNameWithBackButton,
      HeaderType.PageNameWithBackButtonOnColoredBackground,
      HeaderType.PageNameWithCloseButton,
    ].includes(this.type()),
  );
}

export enum HeaderType {
  LogoOnly = 'logo-only',
  LogoWithUserAccountButton = 'logo-with-user-account-button',
  PageNameWithBackButton = 'page-name-with-back-button',
  PageNameWithBackButtonOnColoredBackground = 'page-name-with-back-button-on-colored-background',
  PageNameWithCloseButton = 'page-name-with-close-button',
}
