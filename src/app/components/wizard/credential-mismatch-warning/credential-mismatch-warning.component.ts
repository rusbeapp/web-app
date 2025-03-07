import { Component, inject, output, signal } from '@angular/core';

import { WarningCardComponent } from '@rusbe/components/warning-card/warning-card.component';
import { WizardStep } from '@rusbe/pages/account/wizard/wizard.component';
import { AccountService } from '@rusbe/services/account/account.service';
import { AuthStateService } from '@rusbe/services/auth-state/auth-state.service';

import { InterludeComponent } from '../../interlude/interlude.component';

@Component({
  selector: 'rusbe-wizard-credential-mismatch-warning',
  imports: [WarningCardComponent, InterludeComponent],
  templateUrl: './credential-mismatch-warning.component.html',
})
export class WizardCredentialMismatchWarningComponent {
  exitWizard = output<void>();
  goToStep = output<WizardStep>();

  accountService = inject(AccountService);
  authStateService = inject(AuthStateService);

  IntegrationDataClearingStatus = IntegrationDataClearingStatus;

  clearingStatus = signal<IntegrationDataClearingStatus>(
    IntegrationDataClearingStatus.Idle,
  );

  async clearIntegrationDataAndContinue() {
    this.clearingStatus.set(IntegrationDataClearingStatus.ClearingData);
    try {
      await this.accountService.deleteGeneralGoodsIntegrationData();
    } catch {
      this.clearingStatus.set(IntegrationDataClearingStatus.ClearingDataFailed);
      return;
    }

    await this.authStateService.updateAccountAuthState();
  }
}

enum IntegrationDataClearingStatus {
  Idle = 'idle',
  ClearingData = 'clearing-data',
  ClearingDataFailed = 'clearing-data-failed',
}
