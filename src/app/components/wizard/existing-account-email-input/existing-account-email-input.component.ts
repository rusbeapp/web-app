import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { JumboTextInputComponent } from '@rusbe/components/jumbo-text-input/jumbo-text-input.component';
import { WizardStep } from '@rusbe/pages/account/wizard/wizard.component';

@Component({
  selector: 'rusbe-wizard-existing-account-email-input',
  imports: [JumboTextInputComponent, FormsModule],
  templateUrl: './existing-account-email-input.component.html',
})
export class WizardExistingAccountEmailInputComponent {
  goToStep = output<WizardStep>();

  email = model.required<string>();

  WizardStep = WizardStep;

  continue() {
    this.goToStep.emit(WizardStep.ExistingGeneralGoodsAccountEmailCheck);
  }
}
