import { Dialog } from '@angular/cdk/dialog';
import {
  Component,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
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

import {
  HeaderComponent,
  HeaderType,
} from '@rusbe/components/header/header.component';
import { AccountService } from '@rusbe/services/account/account.service';
import {
  AccountAuthState,
  AuthStateService,
} from '@rusbe/services/auth-state/auth-state.service';

import {
  BalanceViewerColorScheme,
  BalanceViewerComponent,
} from '../../../components/balance-viewer/balance-viewer.component';
import { UserAvatarComponent } from '../../../components/user-avatar/user-avatar.component';

@Component({
  selector: 'rusbe-account-details-page',
  imports: [
    NgIcon,
    HeaderComponent,
    UserAvatarComponent,
    BalanceViewerComponent,
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
    }),
  ],
})
export class AccountDetailsPageComponent {
  readonly HEADER_TYPE = HeaderType.PageNameWithBackButton;
  readonly BALANCE_VIEWER_COLOR_SCHEME = BalanceViewerColorScheme.Overlay;

  private accountService = inject(AccountService);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);
  dialog = inject(Dialog);

  @ViewChild('confirmDialog') confirmDialogTemplate!: TemplateRef<Element>;

  currentRusbeUser = this.accountService.currentUser;
  authState = this.authStateService.accountAuthState;
  accountData = this.authStateService.generalGoodsAccountData;
  plainTextPassword = signal<string | undefined>(undefined);

  AccountAuthState = AccountAuthState;

  maskedCPF = computed(() => {
    const accountData = this.accountData();

    // TODO: Show a skeleton loading for the account data
    if (!accountData || accountData.cpfNumber.length !== 11) {
      return '•••.•••.•••-••';
    }

    // Mask 3 first digits and 2 last digits
    return `•••.${accountData.cpfNumber.slice(3, 6)}.${accountData.cpfNumber.slice(6, 9)}-••`;
  });

  authUserQueryParam = computed(() => {
    if (!this.currentRusbeUser()) return '';

    return `?authuser=${this.currentRusbeUser()?.email}`;
  });

  async refreshCredentials() {
    try {
      await this.accountService.signIn({ suggestSameUser: true });
      // TODO: Show a skeleton loading for the password
      const accountCredentials =
        await this.accountService.fetchGeneralGoodsAccountCredentials();
      this.plainTextPassword.set(accountCredentials.password);
    } catch {
      this.plainTextPassword.set(undefined);
    }
  }

  hideGeneralGoodsPassword() {
    this.plainTextPassword.set(undefined);
  }

  signOut() {
    this.accountService.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }

  promptDeleteAccount() {
    this.dialog.open(this.confirmDialogTemplate, {
      autoFocus: 'button',
      backdropClass: 'bg-beterraba/60',
    });
  }

  deleteAccount() {
    this.accountService.deleteAccount().then(() => {
      this.router.navigate(['/account/login']);
    });
  }
}
