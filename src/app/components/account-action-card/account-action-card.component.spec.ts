import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountActionCardComponent } from './account-action-card.component';

describe('AccountActionCardComponent', () => {
  let component: AccountActionCardComponent;
  let fixture: ComponentFixture<AccountActionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountActionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
