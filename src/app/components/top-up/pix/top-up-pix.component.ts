import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlarmClock,
  lucideCalendarDays,
  lucideCopy,
  lucideInfo,
  lucideMoveRight,
  lucideScanQrCode,
  lucideUserRound,
} from '@ng-icons/lucide';

import { CardGroupComponent } from '@rusbe/components/cards/card-group/card-group.component';
import { SpinnerComponent } from '@rusbe/components/spinner/spinner.component';
import { GeneralGoodsPixTransactionData } from '@rusbe/services/general-goods/general-goods.service';
import { BrlCurrency } from '@rusbe/types/brl-currency';

@Component({
  selector: 'rusbe-top-up-pix',
  imports: [CardGroupComponent, NgIcon, SpinnerComponent],
  templateUrl: './top-up-pix.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideCopy,
      lucideScanQrCode,
      lucideCalendarDays,
      lucideUserRound,
      lucideMoveRight,
      lucideInfo,
      lucideAlarmClock,
    }),
  ],
  host: {
    class: 'flex flex-grow flex-col items-start justify-start',
  },
})
export class TopUpPixComponent {
  finished = output();

  readonly CURRENT_DATE = new Date();
  readonly LOCALIZED_CURRENT_DATE = this.parseCurrentDate();

  topUpValue = input.required<string>();
  cpf = input.required<string>();
  name = input.required<string>();
  timeLeft = input.required<string>();

  pixTransactionData = input<GeneralGoodsPixTransactionData | null>();

  pixQrCodeSource = computed(() => this.parseBase64ImageSource());
  parsedTopUpValue = computed(() =>
    BrlCurrency.fromNumber(parseFloat(this.topUpValue())).toString(),
  );
  parsedCpf = computed(() => this.parseCpfNumber());

  showPixQrCode = signal<boolean>(false);
  copiedToClipboard = signal<boolean>(false);

  private readonly clipboard = inject(Clipboard);

  copyPasswordToClipboard() {
    const pixTransactionData = this.pixTransactionData();
    if (!pixTransactionData) return;
    this.clipboard.copy(pixTransactionData.qrCodeString);
    this.copiedToClipboard.set(true);
  }

  onFinish() {
    this.finished.emit();
  }

  private parseCurrentDate(): string {
    const dateString = this.CURRENT_DATE.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const timeString = Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(this.CURRENT_DATE);
    return `${dateString}, ${timeString}`;
  }

  private parseBase64ImageSource(): string {
    const pixTransactionData = this.pixTransactionData();
    if (!pixTransactionData) return '';
    return `data:image/png;base64, ${pixTransactionData.qrCodeBase64Image}`;
  }

  private parseCpfNumber(): string {
    const cpfNumber = this.cpf();
    if (!cpfNumber) return '';
    return cpfNumber.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '•••.$2.$3-••');
  }
}
