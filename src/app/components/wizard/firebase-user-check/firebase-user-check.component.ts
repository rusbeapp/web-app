import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';

import { InterludeComponent } from '@rusbe/components/interlude/interlude.component';
import { UserAvatarComponent } from '@rusbe/components/user-avatar/user-avatar.component';
import { WarningCardComponent } from '@rusbe/components/warning-card/warning-card.component';
import { WizardStep } from '@rusbe/pages/account/wizard/wizard.component';
import { AccountService } from '@rusbe/services/account/account.service';

@Component({
  selector: 'rusbe-wizard-firebase-user-check',
  imports: [UserAvatarComponent, WarningCardComponent, InterludeComponent],
  templateUrl: './firebase-user-check.component.html',
})
export class WizardFirebaseUserCheckComponent {
  goToStep = output<WizardStep>();
  requestSignIn = input<boolean>(false);

  private accountService = inject(AccountService);
  private router = inject(Router);

  SignInStatus = SignInStatus;

  currentUser = this.accountService.currentUser;

  signInStatus = signal<SignInStatus>(SignInStatus.Idle);

  async verifyUser() {
    if (this.requestSignIn()) {
      this.signInStatus.set(SignInStatus.SigningIn);
      try {
        await this.accountService.signIn({ suggestSameUser: true });
      } catch {
        this.signInStatus.set(SignInStatus.SignInFailed);
      }
    }
  }

  continue() {
    this.goToStep.emit(WizardStep.ChooseGeneralGoodsIntegrationType);
  }

  signOut() {
    this.accountService.signOut().then(() => {
      this.router.navigate(['/account/login']);
    });
  }
}

enum SignInStatus {
  Idle = 'idle',
  SigningIn = 'signing-in',
  SignInFailed = 'sign-in-failed',
}
