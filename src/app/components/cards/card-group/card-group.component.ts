import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'section[rusbe-card-group]',
  templateUrl: './card-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grouping-card' },
})
export class CardGroupComponent {
  title = input('');
}
