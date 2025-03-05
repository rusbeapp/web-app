import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoveRight } from '@ng-icons/lucide';

import { LogoComponent } from '@rusbe/components/logo/logo.component';
import { BrlCurrency } from '@rusbe/types/brl-currency';

import { PaymentMethods } from '../payment-method/payment-method.component';

@Component({
  selector: 'rusbe-top-up-in-loco-helper',
  imports: [LogoComponent, NgIcon],
  templateUrl: './top-up-in-loco-helper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideMoveRight,
    }),
  ],
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
    return cpfNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
