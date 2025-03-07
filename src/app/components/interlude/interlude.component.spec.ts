import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterludeComponent } from './interlude.component';

describe('InterludeComponent', () => {
  let component: InterludeComponent;
  let fixture: ComponentFixture<InterludeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterludeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InterludeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
