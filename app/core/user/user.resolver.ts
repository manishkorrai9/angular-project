import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private data = new Subject<any>();
  
  setData(data: any) {
    this.data.next(data);
  }

  getData() {
    return this.data.asObservable();
  }
}