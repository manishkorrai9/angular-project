import {
  Component,
  Inject,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { Country } from "app/modules/admin/apps/contacts/contacts.types";
import { ContactsService } from "app/modules/admin/apps/contacts/contacts.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "app/core/auth/auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { APIService } from "app/core/api/api";


@Component({
  selector: 'app-view-care-team',
  templateUrl: './view-care-team.component.html',
  styleUrls: ['./view-care-team.component.scss'],
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      .view-details-form .mat-dialog-container {
        padding: 0px;
      }
    `, 
  ],
})
export class ViewCareTeamComponent implements OnInit {
  careTeam: any = {
    avatar: null,
    role: 'Care Supporter',
    name: this.data.careTeam.first_name + ' ' +  this.data.careTeam.last_name,
    gender: '',
    age: null,
    country: 'in',
    status: 'active',
    mobileNumber: this.data.careTeam.mobile_no,
    email: this.data.careTeam.email_address,
    date: this.data.careTeam.created_on,
  };
  careTeamForm: FormGroup;

  editMode: boolean = false;
  countries: Country[];
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  adminInfo: any;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<any>,
    private _contactsService: ContactsService,
    private _formBuilder: FormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private httpService: APIService,
    @Inject(MAT_DIALOG_DATA) public data: { careTeam: any, action: string }
  ) { 
    this.adminInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
    // Create the contact form
    this.careTeamForm = this._formBuilder.group({
      id: [""],
      avatar: [null],
      name: ["", [Validators.required]],
      email: ["", [Validators.required]],
      mobileNumber: ["", [Validators.required]],
      role: ["", [Validators.required]],
      date: ["", [Validators.required]],
    });

    // Patch values to the form
    this.careTeamForm.patchValue(this.careTeam);

    // Get the countries
    this._contactsService.countries$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((countries: Country[]) => {
        // Update the countries
        this.countries = countries;

        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

      if (this.data && this.data.action && this.data.action=='edit') {
        this.editMode = true;
      }
  }

  /**
   * Get country info by iso code
   *
   * @param iso
   */
  getCountryByIso(iso: string): Country {
    return this.countries.find((country) => country.iso === iso);
  }

  /**
   * Toggle edit mode
   *
   * @param editMode
   */
  toggleEditMode(editMode: boolean | null = null): void {
    if (editMode === null) {
      this.editMode = !this.editMode;
    } else {
      this.editMode = editMode;
    }

    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  /**
     * On destroy
     */
   ngOnDestroy(): void
   {
       // Unsubscribe from all subscriptions
       this._unsubscribeAll.next();
       this._unsubscribeAll.complete();
   }

   updateUser() {
    let name = this.careTeamForm.get('name').value.split(' ');
    const body = {
      userid: this.data.careTeam.user_id,
      username: this.careTeamForm.get('email').value,
      password: 'test@1234',
      firstname: name[0],
      lastname: name[1],
      emailaddress: this.careTeamForm.get('email').value,
      mobileno: this.careTeamForm.get('mobileNumber').value,
      roleid: this.data.careTeam.role_id,
      actionby: this.adminInfo.user_id,
    };
    this.httpService.create('api/User/UpdateUser', body).subscribe(
      (res: any) => {
        this.dialogRef.close(true);
        this.SaveActivity();
        this.snackBar.open('User updated successfully.', 'close', {
          panelClass: 'snackBarSuccess',
          duration: 2000,
        });
      },
      (error: any) => {
        this.dialogRef.close();
        console.warn('error', error);
      }
    );
  }

  SaveActivity() {
    const desc = "Updated <b>"+this.careTeamForm.get('name').value+" - Care Supporter </b> details";
    const body = {
      activityid: 0,
      userid: this.adminInfo.user_id,
      titlename: "Member updated",
      descriptionname: desc,
      createdby: this.adminInfo.user_id,
      categoryname: "EditUser"
    };
    const url = `api/PatientRegistration/CreateActivity`;
    this.httpService.create(url, body).subscribe((res: any) => { },
      (error: any) => { console.log('error', error); });
  }

}
