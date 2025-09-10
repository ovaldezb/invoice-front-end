import { TestBed } from '@angular/core/testing';

import { TimbresService } from './timbres.service';

describe('TimbresService', () => {
  let service: TimbresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimbresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
