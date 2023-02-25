import { Component, Inject, OnInit, ViewEncapsulation } from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { APIService } from "app/core/api/api";
import { AuthService } from "app/core/auth/auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import {  Subject } from 'rxjs';

@Component({
  selector: 'app-add-staff-modal',
  templateUrl: './add-staff-modal.component.html',
  styleUrls: ['./add-staff-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddStaffModalComponent implements OnInit {

  userForm: FormGroup;
  userInfo: any;
  editMode: boolean = false;
  labId:any;
  userActionLoading:boolean = false;
  hospitals:any[] = [];
  /** list of banks */
  doctors: any[] = [];

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  roles= [
    {
      "masterdata_id": 474,
      "data_name": "Frontdesk"
    },
    {
      "masterdata_id": 481,
      "data_name": "Care Coordinator"
    },
    {
      "masterdata_id": 477,
      "data_name": "Lab"
    }
  ];
  /** indicate search operation is in progress */
  searching = false;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<any>,
    private _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpService: APIService,
    private auth: AuthService,
    private snackBar: MatSnackBar) {
    this.userInfo = JSON.parse(this.auth.user);
    this.hospitals.push({
      clinic_name: this.userInfo.first_name,
      clinicid: this.userInfo.user_id,
      admin:true
    });
    
  }

  ngOnInit(): void {
    console.log(this.data)
    this.userForm = this._formBuilder.group({ 
      // firstName: ["", [Validators.required]],
      // lastName: ["", [Validators.required]],
      name: ['', [Validators.required]],
      clinicId: [this.userInfo.user_id, [Validators.required]],
      doctorId: [''],
      doctorInput : [''],
      email: ["", [Validators.required, Validators.email]],
      mobileNumber: [
        null,
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern('[6-9]\\d{9}')
        ],
      ],
      roleId: ['', [Validators.required]],
    });

    // this.userForm.get('doctorId').disable();

    // if(this.data && this.data.accountInfo){
    //   this.userForm.patchValue({
    //     name: this.data.full_name,
    //     clinicId: this.data.isadmin_account ? this.userInfo.user_id : this.data.refered_clinicid,
    //     email: this.data.email_address,
    //     mobileNumber: this.data.mobile_no,
    //     roleId: this.data.role_id,
    //   });
    // }
  //  this.getSubClinics(this.userInfo.user_id);
    this.getDoctorsList();
   
  }


  searchDoctor(event:any) {
    if(this.userForm.get('clinicId').value) {
      this.httpService.getAll(`api/Doctor/SearchDoctor?searchText=${event.term}&mainbranchid=${this.userForm.get('clinicId').value}&ismainbranch=${this.userForm.get('clinicId').value == this.userInfo.user_id ? true : false}`).subscribe(
        (res: any) => {
          if(res.data && res.data.length !== 0) {
            this.doctors = res.data;
          }else {
            this.doctors = [];
          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
    }
    
  }

  patchForm(data: any) {

    let doctorIds = [];
    if (data.coordinate_team) {
      data.coordinate_team.forEach(element => {
        doctorIds.push(element.team_id);
      });
    }
    
    this.userForm.patchValue({
      name: data.full_name,
      clinicId: data.isadmin_account ? this.userInfo.user_id : data.refered_clinicid,
      email: data.email_address,
      mobileNumber: data.mobile_no,
      roleId: data.role_id,
      doctorId: doctorIds,

    });
    this.labId = data.role_id;

    if (data.role_id == 481) {
      this.userForm.get('doctorId').setValidators([Validators.required]);
    }
  
    this.userForm.get('doctorId').enable();
    this.userForm.get('doctorId').updateValueAndValidity();
   // this.getDoctorsList();
  }

  getSubClinics(userId: number) {
    this.httpService.get("api/User/GetSubClinics?mainbranchid=", userId).subscribe(
      (res: any) => {
        if(res.data && res.data.length !== 0) {
          this.hospitals = [...this.hospitals, ...res.data];
          if(this.data && this.data.accountInfo) {
            
          }
        }else {
          
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  

  addUser() {
    this.userActionLoading = true;
    let name = this.userForm.get("name").value;
    let firstName = name.split(' ').slice(0, -1).join(' ');
    let lastName = name.split(' ').slice(-1).join(' ');


    let doctors = [];
    if (this.userForm.get("roleId").value == 474) {
      this.doctors.forEach(element => {
        doctors.push(element.user_id);
      });
    }
    
    const body = {
      userid: this.data && this.data.accountInfo ? this.data.accountInfo.user_id : 0,
      username: this.userForm.get("email").value,
      password: 'test@1234',
      firstname: firstName,
      lastname: lastName,
      clinicid: this.userForm.get("clinicId").value,
      adminaccount: this.userInfo.user_id,
      undermainbranch: this.userInfo.user_id == this.userForm.get("clinicId").value ? true : false,
      emailaddress: this.userForm.get("email").value,
      mobileno: this.userForm.get("mobileNumber").value,
      roleid: parseInt(this.userForm.get("roleId").value),
      actionby: this.userInfo.user_id,
      coordinate_team : this.userForm.get("roleId").value == 474 ? doctors :this.userForm.get("doctorId").value ? this.userForm.get("doctorId").value : undefined
    };

    this.httpService.create("api/User/AddUser", body).subscribe(
      (res: any) => {

        if(res?.isSuccess) {
          this.dialogRef.close(true);
          this.SaveActivity();
          this.snackBar.open('User added successfully. ', 'close', {
            panelClass: "snackBarSuccess",
            duration: 2000,
          });
        }else {
          this.snackBar.open(res.data, 'close', {
            panelClass: "snackBarWarning",
            duration: 2000,
          });
        }
        this.userActionLoading = false;
      },
      (error: any) => {
        this.userActionLoading = false;
        console.warn("error", error);
      }
    );
  }

  SaveActivity() {
    const roleId= parseInt(this.userForm.get("roleId").value);
    const roleName = this.roles.find(f=>f.masterdata_id === roleId).data_name;
    const body = {
      activityid: 0,
      userid: this.userInfo.user_id,
      titlename: "Added Staff",
      descriptionname: "Added <b>"+this.userForm.get("name").value+"</b> as <b>"+roleName +"</b>",
      createdby: this.userInfo.user_id,
      categoryname: "AddStaff"
    };
    const url = `api/PatientRegistration/CreateActivity`;
    this.httpService.create(url, body).subscribe((res: any) => { },
      (error: any) => { console.log('error', error); });
  }

  selectHospital() {
    this.userForm.get('doctorId').setValue(null);
    this.doctors = [];
    this.userForm.get('doctorId').enable();
    this.getDoctorsList(true);
  }

  getDoctorsList(isReset?:boolean) {
    
    const url = `api/User/GetHospitalbasedUsers?roleid`;
    const body = {
      roleid: 5,
      pageSize: 100,
      pageNo: 1,
      clinicid: this.userForm.get('clinicId').value,
      ismainbranch: this.userForm.get('clinicId').value == this.userInfo.user_id ? true : false,
    
      // fromdate: this.dateForm.get('fromDate').value
      //   ? moment(this.dateForm.get('fromDate').value).format('YYYY-MM-DD')
      //   : null,
      // todate: this.dateForm.get('toDate').value
      //   ? moment(this.dateForm.get('toDate').value).format('YYYY-MM-DD')
      //   : null,
      userid: this.userInfo.user_id
    };
    this.httpService.create(url, body).subscribe((res: any) => {
      if(res.data.userdata) {
        this.doctors = res.data.userdata
        // if(!isReset) {
        //   this.userForm.get('doctorId').setValue([this.data.accountInfo.created_by]);
        // }

        
        if(this.data && this.data.accountInfo) {
          this.patchForm(this.data.accountInfo);
        }
        
      }
    });
  }

  changeRole(value){
    this.labId=value;


    if (value == 481) {
      this.userForm.get('doctorId').setValidators([Validators.required]);
      this.userForm.get('doctorId').setValue([]);
    }else {
      this.userForm.get('doctorId').clearValidators();   
    }
   
    this.userForm.get('doctorId').updateValueAndValidity();

    // this.userForm.get('doctorId').
    // this.userForm.get('doctorId').setValue(undefined);
  }
}
