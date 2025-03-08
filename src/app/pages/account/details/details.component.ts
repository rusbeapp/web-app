import { Dialog } from '@angular/cdk/dialog';
import {
  Component,
  TemplateRef,
  computed,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideEye,
  lucideEyeOff,
  lucideKeyRound,
  lucideLock,
  lucideLogOut,
  lucideMail,
  lucidePlus,
  lucideSquareArrowOutUpRight,
  lucideTrash,
  lucideUserRoundPen,
} from '@ng-icons/lucide';

import { AccountActionCardComponent } from '@rusbe/components/account-action-card/account-action-card.component';
import {
  BalanceViewerColorScheme,
  BalanceViewerComponent,
} from '@rusbe/components/balance-viewer/balance-viewer.component';
import {
  HeaderComponent,
  HeaderType,
} from '@rusbe/components/header/header.component';
import { InterludeComponent } from '@rusbe/components/interlude/interlude.component';
import { UserAvatarComponent } from '@rusbe/components/user-avatar/user-avatar.component';
import { AccountService } from '@rusbe/services/account/account.service';
import {
  AccountAuthState,
  AuthStateService,
} from '@rusbe/services/auth-state/auth-state.service';
import { DEFAULT_GENERATED_PASSWORD_LENGTH } from '@rusbe/services/crypto/crypto.service';
import { GeneralGoodsBalanceType } from '@rusbe/services/general-goods/general-goods.service';
import { formatIdentifierAsCpf } from '@rusbe/utils/strings';

@Component({
  selector: 'rusbe-account-details-page',
  imports: [
    RouterModule,
    NgIcon,
    HeaderComponent,
    UserAvatarComponent,
    BalanceViewerComponent,
    InterludeComponent,
    AccountActionCardComponent,
  ],
  templateUrl: './details.component.html',
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideMail,
      lucideKeyRound,
      lucideLogOut,
      lucideLock,
      lucideSquareArrowOutUpRight,
      lucideTrash,
      lucideChevronRight,
      lucideUserRoundPen,
      lucideEyeOff,
      lucideEye,
    }),
  ],
})
export class AccountDetailsPageComponent {
  readonly HEADER_TYPE = HeaderType.PageNameWithBackButton;
  readonly BALANCE_VIEWER_COLOR_SCHEME = BalanceViewerColorScheme.Overlay;
  readonly HIDDEN_PASSWORD_STRING = '•'.repeat(
    DEFAULT_GENERATED_PASSWORD_LENGTH,
  );

  private accountService = inject(AccountService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);
  dialog = inject(Dialog);

  confirmDialogTemplate =
    viewChild.required<TemplateRef<Element>>('confirmDialog');

  actionInProgress = signal<false | string>(false);
  currentRusbeUser = this.accountService.currentUser;
  authState = this.authStateService.accountAuthState;
  accountData = this.authStateService.generalGoodsAccountData;
  isPlainTextPasswordVisible = signal<boolean>(false);
  plainTextPassword = resource({
    request: () => ({ authState: this.authState() }),
    // `undefined` means the password is still loading, `null` means it cannot be fetched (e.g. credentials are not available).
    loader: async ({ request }) => {
      if (request.authState !== AccountAuthState.LoggedIn) {
        return undefined;
      }

      try {
        const accountCredentials =
          await this.accountService.fetchGeneralGoodsAccountCredentials();

        return accountCredentials.password;
      } catch {
        return null;
      }
    },
  });

  AccountAuthState = AccountAuthState;

  maskedCpf = computed(() => {
    const authState = this.authState();
    const accountData = this.accountData();

    if (authState === undefined) {
      return undefined;
    }

    if (!accountData) {
      return null;
    }

    return formatIdentifierAsCpf(accountData.cpfNumber, {
      maskIdentifier: true,
    });
  });

  authUserQueryParam = computed(() => {
    if (!this.currentRusbeUser()) return '';

    return `?authuser=${this.currentRusbeUser()?.email}`;
  });

  showAddCreditsButton = computed(() => {
    const accountData = this.accountData();
    return accountData?.balance.type === GeneralGoodsBalanceType.PartialGrant;
  });

  async refreshCredentials() {
    await this.accountService.signIn({ suggestSameUser: true });

    // This resource reload only happens when `signInWithPopup` is being used by Firebase Service.
    // When `signInWithRedirect` is used instead, the resource will be loaded as soon as the user
    // is redirected back to the app.
    this.plainTextPassword.reload();
  }

  togglePlainTextPasswordVisibility() {
    this.isPlainTextPasswordVisible.update((value) => !value);
  }

  signOut() {
    this.actionInProgress.set('Saindo...');
    this.accountService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  promptDeleteAccount() {
    if (this.plainTextPassword.value() === undefined) {
      return;
    }

    if (this.plainTextPassword.value() === null) {
      this.refreshCredentials();
      return;
    }

    this.dialog.open(this.confirmDialogTemplate(), {
      autoFocus: 'button',
      backdropClass: 'bg-beterraba/60',
    });
  }

  deleteAccount() {
    this.actionInProgress.set('Apagando sua conta...');
    this.accountService.deleteAccount().then(() => {
      this.router.navigate(['/account/login']);
    });
  }
}
