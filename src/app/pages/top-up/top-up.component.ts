import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideEraser,
  lucideFullscreen,
  lucideListStart,
  lucidePalette,
  lucideRotateCcw,
  lucideUtensils,
} from '@ng-icons/lucide';

import { CardButtonComponent } from '@rusbe/components/cards/card-button/card-button.component';
import { CardGroupComponent } from '@rusbe/components/cards/card-group/card-group.component';
import {
  HeaderComponent,
  HeaderType,
} from '@rusbe/components/header/header.component';

import { GeneralGoodsTransactionType } from './../../services/general-goods/general-goods.service';

@Component({
  selector: 'rusbe-top-up',
  imports: [HeaderComponent, CardGroupComponent, CardButtonComponent, NgIcon],
  templateUrl: './top-up.component.html',
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
    }),
  ],
})
export class TopUpComponent {
  readonly HEADER_TYPE = HeaderType.PageNameWithBackButton;
  appTransactionTypes = Object.values(GeneralGoodsTransactionType);
  inLocoTransactionTypes = [
    'Em espécie',
    'Cartão de crédito',
    'Cartão de débito',
    'Pix',
  ];
  TRANSACTION_TYPE_MESSAGES = {
    [GeneralGoodsTransactionType.Pix]:
      'Use o código gerado para pagar usando Pix.',
    [GeneralGoodsTransactionType.CreditCard]:
      'Use seu cartão de crédito para completar a transação.',
  };
}
