import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import {
  FormGroup,
  NgForm,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
} from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { APIService } from "app/core/api/api";
import { AuthService } from "app/core/auth/auth.service";
import { Observable } from "rxjs";

import { tap, map, startWith } from "rxjs/operators";
import { FuseConfirmationService } from "@fuse/services/confirmation";

@Component({
  selector: "app-test-template-modal",
  templateUrl: "./test-template-modal.component.html",
  styleUrls: ["./test-template-modal.component.scss"],
})
export class TestTemplateModalComponent implements OnInit {
  testGroupForm: FormGroup;
  @ViewChild("testGroupNGForm") testGroupNGForm: NgForm;

  testSubGroupForm: FormGroup;
  @ViewChild("testSubGroupNGForm") testSubGroupNGForm: NgForm;

  individaulTestList: any[] = [];
  specialities: any[] = [];
  selectedTestServiceList: any[] = [];
  testSelectedId: any;
  testByGroupList: any[] = [];
  specimens:any [] = [];
  labTestLists:any [] = [];
  userInfo: any;
  newTests: any;
  value: any;
  groupId:any;
  testName:any;
  range:any;
  unit:any;
  testInfo:any;
  testgroup_id:any;
  mode:any;
  filteredOptions: Observable<string[]>;
  constructor(
    private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<any>,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpService: APIService,
    private _fuseConfirmationService: FuseConfirmationService,
  ) {}

  ngOnInit(): void {
    this.userInfo = JSON.parse(this.auth.user);
    this.testInfo = this.data;
    console.log(this.data.mode);
    this.mode=this.data.mode;
    this.testgroup_id=this.testInfo?.tests?.testgroup_id;
    this.groupId = this.testgroup_id;
    this.testGroupForm = this._formBuilder.group({
      test_group_name: ["", Validators.required],
      specialityid: ["", Validators.required],
      sampleType: ["", Validators.required],
    });

    this.testSubGroupForm = this._formBuilder.group({
      test_name: ["", Validators.required],
      test_method: [""],
    });
    if(this.testInfo && this.testInfo?.tests?.testgroup_id){
      this.testGroupForm.patchValue({
        test_group_name: this.testInfo.tests.group_name,
        specialityid: this.testInfo.tests.department,
        sampleType: this.testInfo.tests.sample_type,
      });
    }
   
    this.getSpecialities();
    this.getSelectedTestServices();
    this.getSpecimenInfo();
    this.getLabTests_ByGroupByID();
  }

  saveTestGroupDetails() {
    const url = `api/Lab/CreateUpdateLabTestGroup`;
    const body = {
      testgroup_id: 0,
      group_name: this.testGroupForm.controls.test_group_name.value,
      sample_type: this.testGroupForm.controls.sampleType.value,
      department: this.testGroupForm.controls.specialityid.value.toString(),
      hospitaladmin_id: this.userInfo.admin_account,
      created_by: this.userInfo.user_id,
    };
    console.log("body", body);
    this.httpService.create(url, body).subscribe(
      (res: any) => {
        this.groupId=res.data;
        if(this.testgroup_id){
          this.snackBar.open("Test Group updated successfully. ", "close", {
            panelClass: "snackBarSuccess",
            duration: 2000,
          });
        }else{
          this.snackBar.open("Test Group added successfully. ", "close", {
            panelClass: "snackBarSuccess",
            duration: 2000,
          });
        }
       
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  getTestGroupIdDetails() {
    this.httpService
      .getAll(
        `api/User/GetPatientsByMobileNo?mobileno=${this.data.phone}&adminid=${this.data.admin_id}`
      )
      .subscribe(
        (res: any) => {
          if (res.data) {
            // this.relationsList=res.data;
            // console.log(this.relationsList)
          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }

  saveIndividualTestDetails() {

    this.testByGroupList.push({

      group_id: this.testInfo?.test?.testgroup_id? this.testInfo?.test?.testgroup_id: this.groupId,
      method: this.testSubGroupForm.controls.test_method.value,
      hospitallabid: this.testSelectedId,
      testName:this.testName,
      unit:this.unit,
      range:this.range,
      isActive:true
    });
    this.snackBar.open("Test added successfully.", "close", {
      panelClass: "snackBarSuccess",
      duration: 2000,
    });
    

    this.testSubGroupForm.get('test_method').setValue(undefined);
    this.clearReports();
    // this.testSubGroupForm
    

  }

  clearReports() {

    this.testSelectedId = undefined;
    this.testName= undefined;
    this.unit= undefined;
    this.range= undefined;
    this.testSubGroupForm.get('test_name').setValue(undefined);

    this.testSubGroupForm.get('test_name').enable();

    this.testSubGroupForm.get('test_name').markAsPristine();
    this.testSubGroupForm.get('test_name').markAsUntouched();

  }

  getIndividualTestDetails() {
    this.httpService
      .getAll(
        `api/User/GetPatientsByMobileNo?mobileno=${this.data.phone}&adminid=${this.data.admin_id}`
      )
      .subscribe(
        (res: any) => {
          if (res.data) {
            this.individaulTestList = res.data;
             console.log(this.individaulTestList)
          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }

  createTemplate() {
    console.log(this.testByGroupList);
    const tempTestByGroupList = [];
    this.testByGroupList.forEach((data: any) => { 
      console.log(data);
      tempTestByGroupList.push({
        test_id:data.test_id ? data.test_id : 0,
        hospitallabid: data.hospitallabid,
        group_id: this.groupId,
        method: data.method,
        isactive: data.isActive
      });
    });
    this.httpService.create("api/Lab/CreateUpdateLabTests_ByGroup", tempTestByGroupList).subscribe(
      (res: any) => {
        if (res?.isSuccess) {
          if(this.testgroup_id){
            this.snackBar.open("Test template updated successfully.", "close", {
              panelClass: "snackBarSuccess",
              duration: 2000,
            });
          }else{
            this.snackBar.open("Test template created successfully.", "close", {
              panelClass: "snackBarSuccess",
              duration: 2000,
            });
          }
          
          this.dialogRef.close(true);
        } 
        // else {
        //   this.snackBar.open("Please select atleast one record", "close", {
        //     panelClass: "snackBarWarning",
        //     duration: 2000,
        //   });
        // }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }
  getSpecialities() {
    const url = `api/User/GetMasterData?mastercategoryid=` + 21;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.specialities = res.data;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getSelectedTestServices() {
    const url = `api/Lab/GetHospitalTestLabServices?hospitaladminid=${this.userInfo.admin_account}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.selectedTestServiceList = res.data;
          console.log(this.selectedTestServiceList);
          this.filteredOptions =
            this.testSubGroupForm.controls.test_name.valueChanges.pipe(
              startWith(""),
              map((value) => this.searchTests(value)),
              tap((value) => (this.value = value))
            );
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  searchTests(value: string) {
    this.newTests = this.selectedTestServiceList;
    const filterValue = value?.toLowerCase();
    this.newTests = this.newTests.filter((option) =>
      option.hospital_test_name?.toLowerCase().includes(filterValue)
    );
    return this.newTests.length
      ? this.newTests
      : [{ hospital_test_name: "No data" }];
  }
 
  onSelectionChangeTest(ev) {
    console.log(ev);
    this.testSelectedId = ev.hospital_labid;
    this.testName=ev.hospital_test_name;
    this.unit=ev.unit;
    this.range=ev.range;
    this.testSubGroupForm.get('test_name').disable();
  }
  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      "no-data": option === "No data",
    };
  }
  getLabTests_ByGroupByID() {
    this.testByGroupList = [];
    this.labTestLists = [];
    const url = `api/Lab/GetLabTests_ByGroup?groupid=` + this.testgroup_id;
    this.httpService.getAll(url).subscribe( 
      (res: any) => {
        if (res.data) {
          
          this.labTestLists = res.data; 
          console.log(this.labTestLists);
          this.labTestLists.forEach((data: any) => { 
           this.testByGroupList.push({
             testName: data.test_name,
             test_id:data.test_id,
             hospitallabid: data.hospital_labid,
             group_id: data.group_id,
             method: data.method,
             unit: data.unit,
             range: data.range,
             isActive: true
           });
         });
        }
        
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  getSpecimenInfo() {
    const url = `api/User/GetMasterData?mastercategoryid=` + 71;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.specimens = res.data;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  delete(data, index:number) {
    console.log(data);
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Test?",
      message:
        "Are you sure you want to delete this? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        
        // this.testByGroupList.splice(index, 1);
        data.isActive = false;
        
        const url = `api/Lab/DeleteLabTest_ByGroup?testid=` + data.test_id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              
              this.snackBar.open("Service deleted successfully. ", "close", {
                panelClass: "snackBarSuccess",
                duration: 2000,
              });
              this.getLabTests_ByGroupByID();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
        // this.getLabTests_ByGroupByID();
      }
    });
  }
  dismiss() {
    this.dialogRef.close();
  }
}
