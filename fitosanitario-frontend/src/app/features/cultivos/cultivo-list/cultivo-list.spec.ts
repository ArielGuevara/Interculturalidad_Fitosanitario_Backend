import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CultivoList } from './cultivo-list';

describe('CultivoList', () => {
  let component: CultivoList;
  let fixture: ComponentFixture<CultivoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CultivoList],
    }).compileComponents();

    fixture = TestBed.createComponent(CultivoList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
