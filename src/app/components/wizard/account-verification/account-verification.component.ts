import { Clipboard } from '@angular/cdk/clipboard';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  model,
  output,
  signal,
} from '@angular/core';

import { Subscription, takeWhile, tap, timer } from 'rxjs';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy } from '@ng-icons/lucide';

import { InterludeComponent } from '@rusbe/components/interlude/interlude.component';
import { SpinnerComponent } from '@rusbe/components/spinner/spinner.component';
import { WarningCardComponent } from '@rusbe/components/warning-card/warning-card.component';
import { WizardStep } from '@rusbe/pages/account/wizard/wizard.component';
import {
  AccountService,
  GeneralGoodsAccountStub,
  GeneralGoodsIntegrationStatus,
  GeneralGoodsIntegrationType,
} from '@rusbe/services/account/account.service';

@Component({
  selector: 'rusbe-wizard-account-verification',
  imports: [SpinnerComponent, NgIcon, InterludeComponent, WarningCardComponent],
  viewProviders: [provideIcons({ lucideCopy })],
  templateUrl: './account-verification.component.html',
})
export class WizardAccountVerificationComponent implements OnInit, OnDestroy {
  RESEND_EMAIL_COOLDOWN_IN_SECONDS = 30;

  goToStep = output<WizardStep>();
  accountStub = model.required<GeneralGoodsAccountStub | undefined>();

  WizardStep = WizardStep;
  GeneralGoodsIntegrationType = GeneralGoodsIntegrationType;
  VerificationStatus = VerificationStatus;

  clipboard = inject(Clipboard);
  accountService = inject(AccountService);

  integrationStatus = signal<GeneralGoodsIntegrationStatus | undefined>(
    undefined,
  );
  copiedToClipboard = signal<boolean>(false);

  emailResendCooldownSecondsRemaining = signal<number>(0);
  resendEmailAvailable = computed(() => {
    return this.emailResendCooldownSecondsRemaining() === 0;
  });
  cooldownTimerSubscription: Subscription | null = null;

  verificationStatus = signal<VerificationStatus>(VerificationStatus.Idle);

  ngOnInit() {
    this.initialize();
  }

  ngOnDestroy() {
    this.clearTimerSubscription();
  }

  async initialize() {
    if (!this.accountStub()) {
      await this.fetchGeneralGoodsAccountStub();
    }
    await this.fetchGeneralGoodsIntegrationStatus();
  }

  async fetchGeneralGoodsAccountStub() {
    const accountStub =
      await this.accountService.fetchGeneralGoodsAccountCredentials();
    this.accountStub.set(accountStub);
  }

  async fetchGeneralGoodsIntegrationStatus() {
    const integrationData =
      await this.accountService.fetchGeneralGoodsIntegrationStatus();
    this.integrationStatus.set(integrationData);
  }

  startCountdown() {
    this.clearTimerSubscription();

    this.emailResendCooldownSecondsRemaining.set(
      this.RESEND_EMAIL_COOLDOWN_IN_SECONDS,
    );

    this.cooldownTimerSubscription = timer(0, 1000)
      .pipe(
        takeWhile(() => this.emailResendCooldownSecondsRemaining() > 0),
        tap(() => {
          this.emailResendCooldownSecondsRemaining.update(
            (seconds) => seconds - 1,
          );
        }),
      )
      .subscribe();
  }

  clearTimerSubscription() {
    if (this.cooldownTimerSubscription) {
      this.cooldownTimerSubscription.unsubscribe();
      this.cooldownTimerSubscription = null;
    }
  }

  async resendEmail() {
    if (!this.resendEmailAvailable()) {
      return;
    }

    this.verificationStatus.set(VerificationStatus.SendingEmail);

    try {
      const integrationStatus = this.integrationStatus();
      const accountStub = this.accountStub()!;

      if (
        integrationStatus?.integrationType ===
        GeneralGoodsIntegrationType.NewAccount
      ) {
        await this.accountService.sendNewGeneralGoodsAccountVerificationEmail(
          accountStub,
        );
      }

      if (
        integrationStatus?.integrationType ===
        GeneralGoodsIntegrationType.ExistingAccount
      ) {
        await this.accountService.sendExistingGeneralGoodsAccountPasswordResetEmail(
          accountStub,
        );
      }

      this.verificationStatus.set(VerificationStatus.Idle);
    } catch {
      this.verificationStatus.set(VerificationStatus.EmailSendingFailed);
      this.clearTimerSubscription();
      this.emailResendCooldownSecondsRemaining.set(0);
    }

    this.startCountdown();
  }

  async completeSetup() {
    this.verificationStatus.set(VerificationStatus.Verifying);

    try {
      const accountStub = this.accountStub()!;
      await this.accountService.completeGeneralGoodsAccountSetup(accountStub);
    } catch {
      this.verificationStatus.set(VerificationStatus.VerificationFailed);
    }
  }

  async copyPasswordToClipboard() {
    const accountStub = this.accountStub()!;
    await this.clipboard.copy(accountStub.password);
    this.copiedToClipboard.set(true);
  }

  // TODO: Auto-verify each 30 seconds
}

enum VerificationStatus {
  Idle = 'idle',
  SendingEmail = 'sending-email',
  EmailSendingFailed = 'email-sending-failed',
  Verifying = 'verifying',
  VerificationFailed = 'verification-failed',
}
