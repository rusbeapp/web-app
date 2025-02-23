import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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

import { NgxCurrencyDirective, NgxCurrencyInputMode } from 'ngx-currency';

import { MealBalanceBreakdownComponent } from '@rusbe/components/meal-balance-breakdown/meal-balance-breakdown.component';
import { WarningCardComponent } from '@rusbe/components/warning-card/warning-card.component';

@Component({
  selector: 'rusbe-top-up-calculator',
  imports: [
    NgIf,
    MealBalanceBreakdownComponent,
    FormsModule,
    NgxCurrencyDirective,
    ReactiveFormsModule,
    WarningCardComponent,
  ],
  templateUrl: './top-up-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-grow flex-col items-start justify-start',
  },
})
export class TopUpCalculatorComponent {
  submitted = output<boolean>();

  inputDisabled = signal(false);
  value = model.required<string>();

  readonly topUpValue = new FormControl(
    { value: '0', disabled: this.inputDisabled() },
    {
      validators: [Validators.required, lowTopUpValue, highTopUpValue],
    },
  );

  readonly maskConfig = {
    align: 'left',
    allowNegative: true,
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

const lowTopUpValue: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  return value < 1 ? { lowTopUpValue: true } : null;
};

const highTopUpValue: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  return value > 100 ? { highTopUpValue: true } : null;
};
