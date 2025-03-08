import { Location } from '@angular/common';
import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';

import {
  HeaderComponent,
  HeaderType,
} from '@rusbe/components/header/header.component';
import { InterludeComponent } from '@rusbe/components/interlude/interlude.component';
import { WizardAccountConfigurationErrorComponent } from '@rusbe/components/wizard/account-configuration-error/account-configuration-error.component';
import { WizardAccountSetupDisclaimerComponent } from '@rusbe/components/wizard/account-setup-disclaimer/account-setup-disclaimer.component';
import { WizardAccountVerificationComponent } from '@rusbe/components/wizard/account-verification/account-verification.component';
import { WizardCredentialMismatchWarningComponent } from '@rusbe/components/wizard/credential-mismatch-warning/credential-mismatch-warning.component';
import { WizardExistingAccountEmailCheckComponent } from '@rusbe/components/wizard/existing-account-email-check/existing-account-email-check.component';
import { WizardExistingAccountEmailInputComponent } from '@rusbe/components/wizard/existing-account-email-input/existing-account-email-input.component';
import { WizardFirebaseUserCheckComponent } from '@rusbe/components/wizard/firebase-user-check/firebase-user-check.component';
import { WizardInProgressComponent } from '@rusbe/components/wizard/in-progress/in-progress.component';
import { WizardIntegrationTypeChooserComponent } from '@rusbe/components/wizard/integration-type-chooser/integration-type-chooser.component';
import { WizardNewAccountIdentifierInputComponent } from '@rusbe/components/wizard/new-account-identifier-input/new-account-identifier-input.component';
import { WizardSetupCompleteComponent } from '@rusbe/components/wizard/setup-complete/setup-complete.component';
import {
  AccountService,
  GeneralGoodsAccountStub,
  GeneralGoodsIntegrationType,
} from '@rusbe/services/account/account.service';
import {
  AccountAuthState,
  AuthStateService,
} from '@rusbe/services/auth-state/auth-state.service';

@Component({
  selector: 'rusbe-account-wizard-page',
  imports: [
    WizardFirebaseUserCheckComponent,
    HeaderComponent,
    WizardIntegrationTypeChooserComponent,
    WizardAccountSetupDisclaimerComponent,
    WizardCredentialMismatchWarningComponent,
    WizardNewAccountIdentifierInputComponent,
    WizardExistingAccountEmailCheckComponent,
    WizardExistingAccountEmailInputComponent,
    WizardInProgressComponent,
    WizardAccountConfigurationErrorComponent,
    WizardAccountVerificationComponent,
    WizardSetupCompleteComponent,
    InterludeComponent,
    NgIcon,
  ],
  templateUrl: './wizard.component.html',
  viewProviders: [provideIcons({ lucideInfo })],
})
export class AccountWizardPageComponent {
  private readonly accountService = inject(AccountService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  HeaderType = HeaderType;
  WizardStep = WizardStep;
  GeneralGoodsIntegrationType = GeneralGoodsIntegrationType;

  currentStep = linkedSignal<
    AccountAuthState | undefined,
    WizardStep | undefined
  >({
    source: this.authStateService.accountAuthState,
    computation: (newAccountAuthState) => {
      // Wizard steps can be changed manually by calling goToStep(), however, when the account authentication state changes,
      // or when wizard is first loaded, we need to determine the next step automatically based on new state.

      // If the user's General Goods account credentials don't match the ones in the database,
      // show a warning screen and proceed to configure the account again.
      if (
        newAccountAuthState ===
        AccountAuthState.GeneralGoodsAccountCredentialMismatch
      ) {
        return WizardStep.CredentialMismatchWarning;
      }

      // If we don't have a fresh token that can be used for operations in Google Drive,
      // show a screen asking the user to refresh their credentials.
      //
      // Users that completed the setup before can also be redirect to the wizard if the General Goods token is expired. In this case,
      // since auth state changes, when the user passes this step, it will be automatically redirected to the setup complete screen.
      if (newAccountAuthState === AccountAuthState.CredentialRefreshRequired) {
        return WizardStep.CredentialRefresh;
      }

      // If the user hasn't started their integration setup, show the greeting screen.
      if (
        newAccountAuthState ===
        AccountAuthState.PendingGeneralGoodsIntegrationSetup
      ) {
        return WizardStep.SetupGreeting;
      }

      // If the user has already completed part of the setup and verification is pending,
      // direct them to the verification step.
      if (
        newAccountAuthState === AccountAuthState.PendingGeneralGoodsVerification
      ) {
        return WizardStep.GeneralGoodsAccountVerification;
      }

      // If the user is logged in, show the setup complete screen.
      if (newAccountAuthState === AccountAuthState.LoggedIn) {
        return WizardStep.SetupComplete;
      }

      // If the General Goods service is unavailable, show a screen informing the user.
      if (
        newAccountAuthState === AccountAuthState.GeneralGoodsServiceUnavailable
      ) {
        return WizardStep.GeneralGoodsServiceUnavailable;
      }

      // We rely on a router guard to ensure that the user is authenticated in Firebase before entering the wizard.
      // Therefore, we don't need to handle the case where the user is not authenticated in Firebase.

      // If the new account authentication is undefined, show a loading screen.
      // Even though the user is authenticated in Firebase, the Auth State Service may still be loading the account authentication state.
      return WizardStep.Loading;
    },
  });
  currentUser = this.accountService.currentUser;
  generalGoodsAccountEmail = signal<string>(this.currentUser()?.email ?? '');
  generalGoodsAccountIdentifier = signal<string>('');
  generalGoodsAccountStub = signal<GeneralGoodsAccountStub | undefined>(
    undefined,
  );

  pageTitle = computed<string>(() => {
    const currentStep = this.currentStep();

    if (
      [
        WizardStep.ExistingGeneralGoodsAccountDisclaimer,
        WizardStep.ExistingGeneralGoodsAccountEmailCheck,
        WizardStep.ExistingGeneralGoodsAccountEmailInput,
        WizardStep.ExistingGeneralGoodsAccountConfigurationInProgress,
      ].includes(currentStep as WizardStep)
    ) {
      return 'Migração de conta';
    }

    if (
      [
        WizardStep.NewGeneralGoodsAccountDisclaimer,
        WizardStep.NewGeneralGoodsAccountIdentifierInput,
        WizardStep.NewGeneralGoodsAccountConfigurationInProgress,
      ].includes(currentStep as WizardStep)
    ) {
      return 'Nova conta';
    }

    if (currentStep === WizardStep.GeneralGoodsAccountVerification) {
      return 'Verificação de conta';
    }

    return 'Conta Rusbé';
  });

  goToStep(step: WizardStep) {
    this.currentStep.set(step);
  }

  chooseIntegrationType(integrationType: GeneralGoodsIntegrationType) {
    if (integrationType === GeneralGoodsIntegrationType.ExistingAccount) {
      this.goToStep(WizardStep.ExistingGeneralGoodsAccountDisclaimer);
    }

    if (integrationType === GeneralGoodsIntegrationType.NewAccount) {
      this.goToStep(WizardStep.NewGeneralGoodsAccountDisclaimer);
    }
  }

  exitWizard() {
    const previousNavigation =
      this.router.lastSuccessfulNavigation?.previousNavigation;

    if (
      previousNavigation != null &&
      previousNavigation.finalUrl?.toString() !== '/account/login'
    ) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  async configureAccount(integrationType: GeneralGoodsIntegrationType) {
    try {
      if (integrationType === GeneralGoodsIntegrationType.NewAccount) {
        this.goToStep(WizardStep.NewGeneralGoodsAccountConfigurationInProgress);
        await this.configureNewGeneralGoodsAccount();
      }

      if (integrationType === GeneralGoodsIntegrationType.ExistingAccount) {
        this.goToStep(
          WizardStep.ExistingGeneralGoodsAccountConfigurationInProgress,
        );
        await this.configureExistingGeneralGoodsAccount();
      }
      await this.authStateService.updateAccountAuthState();
    } catch {
      // TODO: Better error handling
      this.goToStep(WizardStep.GeneralGoodsAccountConfigurationError);
    }
  }

  async configureNewGeneralGoodsAccount() {
    const stub = await this.accountService.generateGeneralGoodsAccountStub(
      GeneralGoodsIntegrationType.NewAccount,
    );

    await this.accountService.createNewGeneralGoodsAccount(
      stub,
      this.generalGoodsAccountIdentifier(),
    );

    this.generalGoodsAccountStub.set(stub);
  }

  async configureExistingGeneralGoodsAccount() {
    const stub = await this.accountService.generateGeneralGoodsAccountStub(
      GeneralGoodsIntegrationType.ExistingAccount,
      this.generalGoodsAccountEmail(),
    );
    await this.accountService.sendExistingGeneralGoodsAccountPasswordResetEmail(
      stub,
    );

    this.generalGoodsAccountStub.set(stub);
  }
}

export enum WizardStep {
  Loading = 'loading',
  GeneralGoodsServiceUnavailable = 'general-goods-service-unavailable',

  CredentialRefresh = 'credential-refresh',
  CredentialMismatchWarning = 'credential-mismatch-warning',

  SetupGreeting = 'wizard-configuration-greeting',

  ChooseGeneralGoodsIntegrationType = 'choose-general-goods-integration-type',

  ExistingGeneralGoodsAccountDisclaimer = 'existing-general-goods-account-disclaimer',
  ExistingGeneralGoodsAccountEmailCheck = 'existing-general-goods-account-email-check',
  ExistingGeneralGoodsAccountEmailInput = 'existing-general-goods-account-email-edit',
  ExistingGeneralGoodsAccountConfigurationInProgress = 'existing-general-goods-account-configuration-in-progress',

  NewGeneralGoodsAccountDisclaimer = 'new-general-goods-account-disclaimer',
  NewGeneralGoodsAccountIdentifierInput = 'new-general-goods-account-identifier-input',
  NewGeneralGoodsAccountConfigurationInProgress = 'new-general-goods-account-configuration-in-progress',

  GeneralGoodsAccountConfigurationError = 'configuration-error',

  GeneralGoodsAccountVerification = 'general-goods-account-verification',

  SetupComplete = 'setup-complete',
}
