import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { LogoComponent } from '@rusbe/components/logo/logo.component';
import { BrlCurrency } from '@rusbe/types/brl-currency';
import { formatIdentifierAsCpf } from '@rusbe/utils/strings';

import { PaymentMethods } from '../payment-method/payment-method.component';

@Component({
  selector: 'rusbe-top-up-in-loco-helper',
  imports: [LogoComponent],
  templateUrl: './top-up-in-loco-helper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-grow flex-col items-start justify-start',
  },
})
export class TopUpInLocoHelperComponent {
  backClicked = output();

  cpf = input.required<string>();
  name = input.required<string>();
  topUpValue = input.required<string>();
  paymentMethod = input.required<PaymentMethods | null>();

  parsedCpf = computed(() => this.parseCpfNumber());
  parsedValue = computed(() =>
    BrlCurrency.fromNumber(parseFloat(this.topUpValue())),
  );

  onBackClicked(): void {
    this.backClicked.emit();
  }

  private parseCpfNumber(): string {
    const cpfNumber = this.cpf();

    if (!cpfNumber) return '';

    return formatIdentifierAsCpf(cpfNumber);
  }
}
