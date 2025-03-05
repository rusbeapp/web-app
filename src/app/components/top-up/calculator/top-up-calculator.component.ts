import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoveRight } from '@ng-icons/lucide';
import { NgxCurrencyDirective, NgxCurrencyInputMode } from 'ngx-currency';

import { MealBalanceBreakdownComponent } from '@rusbe/components/meal-balance-breakdown/meal-balance-breakdown.component';
import { WarningCardComponent } from '@rusbe/components/warning-card/warning-card.component';
import { GeneralGoodsPartialGrantBalance } from '@rusbe/services/general-goods/general-goods.service';
import { BrlCurrency } from '@rusbe/types/brl-currency';

@Component({
  selector: 'rusbe-top-up-calculator',
  imports: [
    NgIf,
    MealBalanceBreakdownComponent,
    FormsModule,
    NgxCurrencyDirective,
    ReactiveFormsModule,
    WarningCardComponent,
    NgIcon,
  ],
  templateUrl: './top-up-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-grow flex-col items-start justify-start',
  },
  viewProviders: [
    provideIcons({
      lucideMoveRight,
    }),
  ],
})
export class TopUpCalculatorComponent {
  submitted = output<boolean>();

  value = model.required<string>();
  currentBalance = input.required<GeneralGoodsPartialGrantBalance>();

  inputDisabled = signal(false);

  newBalance = computed(() =>
    this.currentBalance().value.add(
      BrlCurrency.fromNumber(parseFloat(this.value())),
    ),
  );

  readonly topUpValue = new FormControl(
    { value: '0', disabled: this.inputDisabled() },
    {
      validators: [
        Validators.required,
        lowTopUpValueValidator,
        highTopUpValueValidator,
      ],
    },
  );

  readonly maskConfig = {
    align: 'left',
    allowNegative: false,
    allowZero: true,
    decimal: ',',
    precision: 2,
    prefix: '',
    suffix: '',
    thousands: '',
    nullable: true,
    min: null,
    max: null,
    inputMode: NgxCurrencyInputMode.Financial,
  };

  onSubmitValue() {
    this.topUpValue.markAsTouched();
    if (this.topUpValue.invalid) return;
    this.submitted.emit(true);
  }
}

const lowTopUpValueValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  return value < 1 ? { lowTopUpValue: true } : null;
};

const highTopUpValueValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  return value > 100 ? { highTopUpValue: true } : null;
};
