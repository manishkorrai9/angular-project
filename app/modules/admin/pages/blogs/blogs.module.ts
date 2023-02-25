import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { FuseMasonryModule } from '@fuse/components/masonry';
import { SharedModule } from 'app/shared/shared.module';
import { BlogsComponent } from './blogs.component';
import { BlogsListComponent } from './list/list.component';
import { BlogsAddComponent } from './add/add.component';
import { BlogsLabelsComponent } from './labels/labels.component';
import { blogsRoutes } from './blogs.routing';

@NgModule({
    declarations: [
        BlogsComponent,
        BlogsListComponent,
        BlogsLabelsComponent,
        BlogsAddComponent
    ],
    imports     : [
        RouterModule.forChild(blogsRoutes),
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatRippleModule,
        MatSidenavModule,
        NgSelectModule,
        FormsModule,
        FuseMasonryModule,
        SharedModule,
        QuillModule
    ]
})
export class BlogsModule
{
}
