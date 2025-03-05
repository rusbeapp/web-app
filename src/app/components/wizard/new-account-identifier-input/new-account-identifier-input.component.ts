import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  JumboTextInputComponent,
  JumboTextInputType,
} from '@rusbe/components/jumbo-text-input/jumbo-text-input.component';
import { WizardStep } from '@rusbe/pages/account/wizard/wizard.component';
import { GeneralGoodsIntegrationType } from '@rusbe/services/account/account.service';

@Component({
  selector: 'rusbe-wizard-new-account-identifier-input',
  imports: [JumboTextInputComponent, FormsModule],
  templateUrl: './new-account-identifier-input.component.html',
})
export class WizardNewAccountIdentifierInputComponent {
  goToStep = output<WizardStep>();
  configureAccount = output<GeneralGoodsIntegrationType.NewAccount>();

  identifier = model.required<string>();

  WizardStep = WizardStep;
  JumboTextInputType = JumboTextInputType;

  continue() {
    this.configureAccount.emit(GeneralGoodsIntegrationType.NewAccount);
  }
}
