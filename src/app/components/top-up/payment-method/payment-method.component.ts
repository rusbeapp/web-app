import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { faBrandPix } from '@ng-icons/font-awesome/brands';
import { lucideChevronRight } from '@ng-icons/lucide';

import { CardButtonComponent } from '@rusbe/components/cards/card-button/card-button.component';
import { CardGroupComponent } from '@rusbe/components/cards/card-group/card-group.component';
import { GeneralGoodsTransactionType } from '@rusbe/services/general-goods/general-goods.service';

@Component({
  selector: 'rusbe-top-up-payment-method',
  imports: [CardGroupComponent, CardButtonComponent],
  templateUrl: './payment-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      faBrandPix,
      lucideChevronRight,
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
    [GeneralGoodsTransactionType.Pix]: 'faBrandPix',
    [GeneralGoodsTransactionType.CreditCard]: 'customCreditCard',
    'Em espécie': 'customCash',
    'Cartão de débito': 'customDebitCard',
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
