import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { AllergiesComponent } from './allergies.component';

import { MatAutocompleteModule } from '@angular/material/autocomplete';


@NgModule({
  declarations: [
    AllergiesComponent
  ],
  imports: [
    CommonModule,
    MatAutocompleteModule
  ]
})
export class AllergiesModule { }
