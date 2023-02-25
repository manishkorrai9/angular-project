import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { FormBuilder, FormGroup, NgForm, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { APIService } from "app/core/api/api";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "app/core/auth/auth.service";

@Component({
  selector: "app-add-test-form",
  templateUrl: "./add-test-form.component.html",
  styleUrls: ["./add-test-form.component.scss"],
})
export class AddTestFormComponent implements OnInit {
  addTestForm: FormGroup;
  userInfo: any;
  pagesize = 100;
  pazeno = 1;
  searchkey = "";
  specimens:any [] = [];
  departments:any[] = [];
  testServiceList: any[] = [];
  @ViewChild("addTestFormNGForm") addTestFormNGForm: NgForm;
  constructor(
    private _matDialogRef: MatDialogRef<AddTestFormComponent>,
    public dialogRef: MatDialogRef<any>,
    private _formBuilder: FormBuilder,
    private httpService: APIService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
    this.addTestForm = this._formBuilder.group({
      testName: ["", [Validators.required]],
      testUnits: [""],
      testRange: [""],
      specimen:["", [Validators.required]],
      department:[""]
    });
    this.getMasterDataInfo(71);
    this.getMasterDataInfo(72);
  }

  getMasterDataInfo(type) {
    const url = `api/User/GetMasterData?mastercategoryid=` + type;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        switch (type) {
          case 71:
            this.specimens = res.data;
            break;
          case 72:
            this.departments = res.data;
            break;          
          default:
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  dismiss() {
    this._matDialogRef.close();
  }
  addTest() {
    let payload = {
      // hospitallabid: 0,
      // hospitaladminid: this.userInfo.admin_account,
      // hospitalmastername: "",
      // hospitaltestname: this.addTestForm.value.testName,
      // testunit: this.addTestForm.value.testUnits,
      // testdiff: "",
      // testrange: this.addTestForm.value.testRange,
      // mdorder: 0,
      // actionby: this.userInfo.user_id,
      testname: this.addTestForm.value.testName,
      mastername: '',
      unit: this.addTestForm.value.testUnits,
      range: this.addTestForm.value.testRange,
      actionby: this.userInfo.user_id,
      speciman: this.addTestForm.value.specimen,
      department: this.addTestForm.value.department
    
    };

    this.httpService.create("api/Lab/AddTests", payload).subscribe(
      (res: any) => {
        if (res?.isSuccess) {
          this.dialogRef.close(true);
          this.snackBar.open("Test saved successfully.", "close", {
            panelClass: "snackBarSuccess",
            duration: 2000,
          });
        } else {
          this.snackBar.open(res.data, "close", {
            panelClass: "snackBarWarning",
            duration: 2000,
          });
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }
  Clear(){
    this.addTestForm.reset()
  }
}
