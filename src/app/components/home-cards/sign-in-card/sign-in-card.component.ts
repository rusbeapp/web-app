import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  AccountAuthState,
  AuthStateService,
} from '@rusbe/services/auth-state/auth-state.service';

@Component({
  selector: 'rusbe-sign-in-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './sign-in-card.component.html',
})
export class SignInCardComponent {
  authStateService = inject(AuthStateService);

  AccountAuthState = AccountAuthState;
  cardLinkUrl = computed<string | undefined>(() => {
    const loginStatus = this.authStateService.accountAuthState();

    if (!loginStatus) {
      return undefined;
    }

    const loginStatusToLinkUrl: Record<AccountAuthState, string> = {
      [AccountAuthState.LoggedIn]: '/account/details',
      [AccountAuthState.LoggedOut]: '/account/login',
      [AccountAuthState.CredentialRefreshRequired]: '/account/wizard',
      [AccountAuthState.PendingGeneralGoodsIntegrationSetup]: '/account/wizard',
      [AccountAuthState.PendingGeneralGoodsVerification]: '/account/wizard',
      [AccountAuthState.GeneralGoodsAccountCredentialMismatch]:
        '/account/wizard',
      [AccountAuthState.GeneralGoodsServiceUnavailable]: '/account/details',
    };

    return loginStatusToLinkUrl[loginStatus];
  });

  loginStatus = this.authStateService.accountAuthState;
}
