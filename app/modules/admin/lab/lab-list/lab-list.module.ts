import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { SharedModule } from 'app/shared/shared.module';
import { LabListComponent } from './lab-list.component';
import { LabListRoutes } from './lab-list.routing';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
    declarations: [
        LabListComponent
    ],
    imports     : [
        RouterModule.forChild(LabListRoutes),
        MatIconModule,
        MatPaginatorModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatTooltipModule,
        SharedModule
    ]
})
export class LabListModule
{
}
