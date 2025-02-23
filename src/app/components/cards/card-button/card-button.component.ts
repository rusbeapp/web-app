import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { NgIcon } from '@ng-icons/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[rusbe-card-button]',
  imports: [NgIcon],
  templateUrl: './card-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grouping-card-strip-button w-full disabled:opacity-50' },
})
export class CardButtonComponent {
  subtitle = input('');
  iconName = input('');
}
