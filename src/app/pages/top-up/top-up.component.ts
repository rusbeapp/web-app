import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  HeaderComponent,
  HeaderType,
} from '@rusbe/components/header/header.component';
import { TopUpCalculatorComponent } from '@rusbe/components/top-up/calculator/top-up-calculator.component';
import { TopUpCreditCardComponent } from '@rusbe/components/top-up/credit-card/top-up-credit-card.component';
import { TopUpInLocoHelperComponent } from '@rusbe/components/top-up/in-loco-helper/top-up-in-loco-helper.component';
import {
  PaymentLocation,
  PaymentMethods,
  TopUpPaymentMethodComponent,
} from '@rusbe/components/top-up/payment-method/payment-method.component';
import { TopUpPixComponent } from '@rusbe/components/top-up/pix/top-up-pix.component';
import { AuthStateService } from '@rusbe/services/auth-state/auth-state.service';
import {
  GeneralGoodsPixTransactionData,
  GeneralGoodsService,
} from '@rusbe/services/general-goods/general-goods.service';
import { BrlCurrency } from '@rusbe/types/brl-currency';

@Component({
  selector: 'rusbe-top-up',
  imports: [
    HeaderComponent,
    CommonModule,
    TopUpPaymentMethodComponent,
    TopUpCalculatorComponent,
    TopUpPixComponent,
    TopUpCreditCardComponent,
    TopUpInLocoHelperComponent,
  ],
  templateUrl: './top-up.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopUpComponent {
  readonly HEADER_TYPE = HeaderType.PageNameWithBackButton;
  readonly STAGE_MESSAGE = {
    [TopUpStages.Calculator]: 'Quanto você quer adicionar?',
    [TopUpStages.PaymentMethod]: 'Como você deseja adicionar créditos?',
    [TopUpStages.InLocoHelper]: 'No guichê, mostre essas informações',
    [TopUpStages.Pix]: '',
    [TopUpStages.CreditCard]: '',
  };

  calculatorComponent = viewChild(TopUpCalculatorComponent);
  paymentMethodComponent = viewChild(TopUpPaymentMethodComponent);
  inLocoHelperComponent = viewChild(TopUpInLocoHelperComponent);
  creditCardComponent = viewChild(TopUpCreditCardComponent);
  pixComponent = viewChild(TopUpPixComponent);

  currentStage = computed(() => {
    if (this.calculatorComponent()) {
      return 'calculator';
    } else if (this.paymentMethodComponent()) {
      return 'payment-method';
    } else if (this.inLocoHelperComponent()) {
      return 'in-loco-helper';
    } else if (this.creditCardComponent()) {
      return 'credit-card';
    } else if (this.pixComponent()) {
      return 'pix';
    }
    return 'calculator';
  });

  valueSubmitted = signal(false);
  value = signal('0');
  paymentMethod = signal<PaymentMethods | null>(null);
  paymentLocation = signal<PaymentLocation | null>(null);
  pixCode =
    '00020126580014br.gov.bcb.pix0136bee05743-4291-4f3c-9259-595df1307ba1520400005303986540510.005802BR5914AlexandreLima6019Presidente Prudente62180514Um-Id-Qualquer6304D475';
  pixTransactionData = signal<GeneralGoodsPixTransactionData | null>(null);

  name = computed(
    () => this.authStateService.generalGoodsAccountData()?.fullName ?? '',
  );

  private readonly router = inject(Router);
  private readonly generalGoodsService = inject(GeneralGoodsService);
  private readonly authStateService = inject(AuthStateService);
  cpf = computed(
    () => this.authStateService.generalGoodsAccountData()?.cpfNumber ?? '',
  );

  constructor() {
    effect(async () => {
      if (this.pixComponent()) {
        const pixData =
          await this.generalGoodsService.startAddCreditsTransactionUsingPix(
            BrlCurrency.fromNumber(parseFloat(this.value())),
          );
        this.pixTransactionData.set(pixData);
      }
    });
  }

  goToPreviousStage(): boolean {
    switch (this.currentStage()) {
      case 'calculator':
        return false;
      case 'payment-method':
        this.valueSubmitted.set(false);
        return true;
      case 'credit-card':
      case 'in-loco-helper':
      case 'pix':
        this.paymentLocation.set(null);
        this.paymentMethod.set(null);
        return true;
      default:
        return false;
    }
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  onPaymentMethodChange(paymentMethod: PaymentMethods) {
    this.paymentMethod.set(paymentMethod);
  }

  onPaymentLocaltionChange(paymentLocation: PaymentLocation) {
    this.paymentLocation.set(paymentLocation);
  }

  onCalculatorConfirm(value: boolean) {
    this.valueSubmitted.set(value);
  }
}

export enum TopUpStages {
  Calculator = 'calculator',
  PaymentMethod = 'payment-method',
  Pix = 'pix',
  CreditCard = 'credit-card',
  InLocoHelper = 'in-loco-helper',
}
