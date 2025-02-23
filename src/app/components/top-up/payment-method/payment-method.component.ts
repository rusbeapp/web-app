import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import {
  lucideBanknote,
  lucideChevronRight,
  lucideCreditCard,
  lucideEraser,
  lucideFullscreen,
  lucideListStart,
  lucidePalette,
  lucideRotateCcw,
  lucideUtensils,
} from '@ng-icons/lucide';

import { CardButtonComponent } from '@rusbe/components/cards/card-button/card-button.component';
import { CardGroupComponent } from '@rusbe/components/cards/card-group/card-group.component';
import { SpinnerComponent } from '@rusbe/components/spinner/spinner.component';
import { GeneralGoodsTransactionType } from '@rusbe/services/general-goods/general-goods.service';

@Component({
  selector: 'rusbe-top-up-payment-method',
  imports: [CardGroupComponent, CardButtonComponent, SpinnerComponent],
  templateUrl: './payment-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucidePalette,
      lucideUtensils,
      lucideListStart,
      lucideFullscreen,
      lucideRotateCcw,
      lucideEraser,
      lucideChevronRight,
      lucideCreditCard,
      lucideBanknote,
    }),
  ],
})
export class TopUpPaymentMethodComponent {
  paymentMethodChanged = output<PaymentMethods>();
  paymentLocationChanged = output<PaymentLocation>();

  readonly inAppPaymentMethods = Object.values(GeneralGoodsTransactionType);
  readonly inLocoPaymentMethods = INLOCO_PAYMENT_METHODS;
  readonly PAYMENT_METHOD_MESSAGES = {
    [GeneralGoodsTransactionType.Pix]:
      'Use o código gerado para pagar usando Pix.',
    [GeneralGoodsTransactionType.CreditCard]:
      'Use seu cartão de crédito para completar a transação.',
  };

  readonly PAYMENT_METHOD_ICONS = {
    [GeneralGoodsTransactionType.Pix]: 'pix',
    [GeneralGoodsTransactionType.CreditCard]: 'bootstrapCreditCard',
    'Em espécie': 'bootstrapCash',
    'Cartão de débito': 'bootstrapDebitCard',
  };

  handlePaymentMethodSelection(
    selectedPaymentMethod: PaymentMethods,
    selectedPaymentLocation: PaymentLocation,
  ) {
    this.paymentMethodChanged.emit(selectedPaymentMethod);
    this.paymentLocationChanged.emit(selectedPaymentLocation);
  }
}

export type PaymentLocation = 'InLoco' | 'InApp';

export const INLOCO_PAYMENT_METHODS = [
  'Em espécie',
  'Cartão de crédito',
  'Cartão de débito',
  'Pix',
] as const;

export type PaymentMethods =
  | (typeof INLOCO_PAYMENT_METHODS)[number]
  | GeneralGoodsTransactionType;
