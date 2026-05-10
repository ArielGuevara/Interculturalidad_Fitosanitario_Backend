import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlagaList } from './plaga-list';

describe('PlagaList', () => {
  let component: PlagaList;
  let fixture: ComponentFixture<PlagaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlagaList],
    }).compileComponents();

    fixture = TestBed.createComponent(PlagaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
