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

import { interval, takeUntil, timer } from 'rxjs';

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
import {
  AccountAuthState,
  AuthStateService,
} from '@rusbe/services/auth-state/auth-state.service';
import {
  GeneralGoodsPixTransactionData,
  GeneralGoodsService,
} from '@rusbe/services/general-goods/general-goods.service';
import { BrlCurrency } from '@rusbe/types/brl-currency';
import { RusbeError } from '@rusbe/types/error-handling';

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
  readonly FIFHTEEEN_MINUTES = 15 * 60 * 1000;

  calculatorComponent = viewChild(TopUpCalculatorComponent);
  paymentMethodComponent = viewChild(TopUpPaymentMethodComponent);
  inLocoHelperComponent = viewChild(TopUpInLocoHelperComponent);
  creditCardComponent = viewChild(TopUpCreditCardComponent);
  pixComponent = viewChild(TopUpPixComponent);

  valueSubmitted = signal(false);
  value = signal('0');
  paymentMethod = signal<PaymentMethods | null>(null);
  paymentLocation = signal<PaymentLocation | null>(null);
  pixTransactionData = signal<GeneralGoodsPixTransactionData | null>(null);
  pixErrorMessage = signal('');
  remainingTimeString = signal(this.parseRemainingTime(0));

  accountData = computed(() => {
    const accountData = this.authStateService.generalGoodsAccountData();
    if (!accountData) return { fullName: '', cpfNumber: '' };

    return {
      fullName: accountData.fullName,
      cpfNumber: accountData.cpfNumber,
    };
  });

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

  topUpUnavailable = computed(() => {
    const accountAuthState = this.authStateService.accountAuthState();

    return accountAuthState === AccountAuthState.GeneralGoodsServiceUnavailable;
  });

  private readonly router = inject(Router);
  private readonly generalGoodsService = inject(GeneralGoodsService);
  private readonly authStateService = inject(AuthStateService);

  constructor() {
    effect(() => {
      if (this.pixComponent()) this.startPixTransaction();
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

  private async startPixTransaction() {
    try {
      const pixTransactionResponse =
        await this.generalGoodsService.startAddCreditsTransactionUsingPix(
          BrlCurrency.fromNumber(parseFloat(this.value())),
        );
      this.pixTransactionData.set(pixTransactionResponse);

      this.startPixTimer();
    } catch (error) {
      if (error instanceof RusbeError) {
        this.pixErrorMessage.set(
          'Ocorreu um erro ao tentar gerar o código pix.',
        );
        return;
      }
      this.pixErrorMessage.set(
        'Ocorreu um erro desconhecido. Por favor, tente novamente.',
      );
    }
  }

  private startPixTimer() {
    const source = interval(1000);

    const result = source.pipe(takeUntil(timer(this.FIFHTEEEN_MINUTES)));

    result.subscribe({
      next: (timeSpent) => {
        this.remainingTimeString.set(this.parseRemainingTime(timeSpent));
      },
      complete: () => {
        this.router.navigate(['/']);
      },
    });
  }

  private parseRemainingTime(timeSpent: number): string {
    const remainingTime = this.FIFHTEEEN_MINUTES - timeSpent * 1000;
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}

export enum TopUpStages {
  Calculator = 'calculator',
  PaymentMethod = 'payment-method',
  Pix = 'pix',
  CreditCard = 'credit-card',
  InLocoHelper = 'in-loco-helper',
}
