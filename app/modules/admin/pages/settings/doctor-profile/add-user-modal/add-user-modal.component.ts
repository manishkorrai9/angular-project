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

@Component({
  selector: 'app-add-user-modal',
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddUserModalComponent implements OnInit {

  userForm: FormGroup;
  userInfo: any;
  editMode: boolean = false;
  userActionLoading:boolean = false;
  hospitals:any[] = [];
  specialities:any[] = [];
  roles= [
    {
      "masterdata_id": 4,
      "data_name": "Care Team"
    },
    {
      "masterdata_id": 5,
      "data_name": "Doctor"
    },
    {
      "masterdata_id": 6,
      "data_name": "Customer Support"
    }
  ];

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
    })
  }

  ngOnInit(): void {
    console.log(this.data)
    this.userForm = this._formBuilder.group({ 
      // firstName: ["", [Validators.required]],
      // lastName: ["", [Validators.required]],
      name: ['', [Validators.required]],
      clinicId: [this.userInfo.user_id, [Validators.required]],
      specialityid:['', [Validators.required]],
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
      roleId: [this.data.roleId, [Validators.required]],
    });
    // this.getSubClinics(this.userInfo.user_id);
    this.getSpecialityList();
   
  }
  getSpecialityList() {

    const url = `api/Doctor/GetDoctorSpecialitiesForHospitals?adminid=${this.userInfo?.admin_account}`;


    // const url = `api/User/GetMasterData?mastercategoryid=`+21;
     
    this.httpService.getAll(url).subscribe((res: any) => {
        this.specialities=res.data

        if (this.data && this.data.accountInfo) {
          this.patchForm(this.data.accountInfo);            
        }

    },
    (error: any) => {
        console.log('error', error);
    });
  }
  patchForm(data: any) {

    this.userForm.patchValue({
      name: data.full_name,
      clinicId: data.isadmin_account ? this.userInfo.user_id : data.refered_clinicid,
      email: data.email_address,
      specialityid:data.speciality_id,
      mobileNumber: data.mobile_no,
      roleId: this.data.roleId
    });
    console.log(this.userForm);
  }

  getSubClinics(userId: number) {
    this.httpService.get("api/User/GetSubClinics?mainbranchid=", userId).subscribe(
      (res: any) => {
        if(res.data && res.data.length !== 0) {
          this.hospitals = [...this.hospitals, ...res.data];
         
        }else {
          if(this.data && this.data.accountInfo) {
            this.patchForm(this.data.accountInfo);
          }
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
    const body = {
      userid: this.data && this.data.accountInfo ? this.data.accountInfo.user_id : 0,
      username: this.userForm.get("email").value,
      password: 'test@1234',
      firstname: firstName,
      lastname: lastName,
      clinicid: this.userForm.get("clinicId").value,
      adminaccount: this.userInfo.user_id,
      isadminaccount: this.data && this.data.accountInfo ? this.data.accountInfo.isadmin_account : false,
      undermainbranch: this.userInfo.user_id == this.userForm.get("clinicId").value ? true : false,
      emailaddress: this.userForm.get("email").value,
      mobileno: this.userForm.get("mobileNumber").value,
      specialityid:this.userForm.get("specialityid").value,
      roleid: parseInt(this.userForm.get("roleId").value),
      actionby: this.userInfo.user_id,
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
      titlename: "Added Doctor",
      descriptionname: "Added <b>"+this.userForm.get("name").value+"</b> as <b>"+roleName +"</b>",
      createdby: this.userInfo.user_id,
      categoryname: "AddDoctor"
    };
    const url = `api/PatientRegistration/CreateActivity`;
    this.httpService.create(url, body).subscribe((res: any) => { },
      (error: any) => { console.log('error', error); });
  }
  clear(){
    this.userForm.reset();
  }
  

}
