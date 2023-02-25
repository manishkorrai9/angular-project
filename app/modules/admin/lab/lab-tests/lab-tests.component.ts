import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { FormGroup, NgForm, Validators, FormControl } from "@angular/forms";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { APIService } from "app/core/api/api";

import { BehaviorSubject, Observable, Subject } from "rxjs";
import moment from "moment";

import { AuthService } from "app/core/auth/auth.service";
import { Router } from "@angular/router";
import { COMMA, ENTER } from "@angular/cdk/keycodes";

import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";

export type PatientData = {
  patientid: number;
  details: string;
};
export type DoctorData = {
  doctorid: number;
  details: string;
};

@Component({
  selector: "app-lab-tests",
  templateUrl: "./lab-tests.component.html",
  styleUrls: ["./lab-tests.component.scss"],
})
export class LabTestsComponent implements OnInit {
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl = new FormControl();
  filteredFruits: Observable<string[]>;
  fruits: string[];

  @ViewChild("fruitInput", { static: false })
  fruitInput: ElementRef<HTMLInputElement>;
  @ViewChild("auto", { static: false }) matAutocomplete: MatAutocomplete;
  filteredTestsOptions$ = new BehaviorSubject<any[]>(null);

  appointmentForm: FormGroup;
  patientAppointmentForm: FormGroup;
  submitted = false;
  patientData: PatientData;
  selectedPatient: string;
  accountInfo: any;
  inputText: string;
  doctorText: string;
  selectedPatientId: any;
  selectedPatient$ = new BehaviorSubject<string>(null);
  selectedDoctor: number;
  filterVal = "";
  filterSubject = new Subject();
  @ViewChild("labInput") labInput: ElementRef<HTMLInputElement>;
  @ViewChild("patientaAppointmentNGForm") patientaAppointmentNGForm: NgForm;
  myControl = new FormControl();
  options: string[] = ["One", "Two", "Three"];
  filteredOptions: Observable<string[]>;
  filteredOptions$ = new BehaviorSubject<DoctorData[]>([]);

  filteredPatientOptions$ = new BehaviorSubject<PatientData[]>(null);

  isEditMode = false;
  patientId = "";
  appTypes: any;

  userInfo: any;
  isDoctor: boolean;
  patientUrl: boolean = true;
  Time: any;
  specialities: any[] = [];
  labs: any[] = [];
  pid: any;
  constructor(
    public dialogRef: MatDialogRef<any>,
    private httpService: APIService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    private dialog: MatDialog,
    private _matDialogRef: MatDialogRef<LabTestsComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
    console.log(this.data);
    if(this.data.page === 'test-queue'){
      this.getTestsList();
    }
   
    console.log(moment(new Date()).format("yyyy-MM-DD"));
    this.patientAppointmentForm = new FormGroup({
      specialityid: new FormControl("", [Validators.required]),
      doctorId: new FormControl({ value: "", disabled: true }, [
        Validators.required,
      ]),
    });

    if (this.userInfo?.role_id === 5) {
      this.isDoctor = true;

      this.patientAppointmentForm.patchValue({
        scheduleDate: moment(new Date()).format("yyyy-MM-DD"),
      });
      this.patientAppointmentForm.patchValue({ appointmentId: "72" });
    } else {
      this.isDoctor = false;
    }

    this.getMasterDataInfo();

    if (this.data && this.data.appointmentdata) {
      this.isEditMode = true;
    }

    this.patientId = this.data.patient ? this.data.patient.user_id : 0;

    if (this.patientId) {
      this.selectedPatientId = this.patientId;

      if (this.data.patient.patient_name) {
        this.selectedPatient$.next(this.data.patient.patient_name + " " + this.data.patient.age +
        "yrs" +
        " - " +
        this.data.patient.gender)
      } else {
        this.selectedPatient$.next(
          this.data.patient.first_name +
            " " +
            this.data.patient.last_name +
            " - " +
            this.data.patient.age +
            "yrs" +
            " - " +
            this.data.patient.gender
        );
      }
    
    }
  }

  clearReports() {
    this.inputText = undefined;
    this.selectedPatientId = undefined;
    this.selectedPatient$.next(null);
  }

  clearDoctorId() {
    this.doctorText = undefined;
    this.selectedDoctor = undefined;
    this.patientAppointmentForm.controls["doctorId"].setValue(undefined);
    this.patientAppointmentForm.controls["doctorId"].enable();
  }

  getMasterDataInfo() {
    const url = `api/User/GetMasterData?mastercategoryid=24`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.appTypes = res.data;
      },
      (error: any) => {
        console.log("error", error);
      }
    );

    const url2 = `api/User/GetMasterData?mastercategoryid=` + 21;

    this.httpService.getAll(url2).subscribe(
      (res: any) => {
        this.specialities = res.data;

        if (this.userInfo?.role_id === 5) {
          // this.getDoctorDetails();
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

  events: string[] = [];
  date: any;
  clearFields() {
    this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
    this.patientAppointmentForm.controls.scheduleDate.setValue(undefined);
    this.patientAppointmentForm.controls.appointmentId.setValue(undefined);
  }
  add(event: MatChipInputEvent): void {
    // Add fruit only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      // Add our fruit
      if ((value || "").trim()) {
        this.fruits.push(value.trim());
      }

      // Reset the input value
      if (input) {
        input.value = "";
      }

      this.fruitCtrl.setValue(null);
    }
  }

  remove(fruit: string): void {
    const index = this.fruits.indexOf(fruit);

    if (index >= 0) {
      this.fruits.splice(index, 1);
    }
  }
  disablebtn:boolean=false;
  removeLab(lab: any): void {
    lab.isactive = false;
    let labs = this.labs.filter((obj) => obj.isactive );
    if (labs.length  == 0) {
      this.disablebtn=false;
    } else {
       this.disablebtn=true;
    }
   
  }
  selectedLab(event: MatAutocompleteSelectedEvent): void {
    this.disablebtn=true;
    console.log( event.option.value)
    this.labs.push({
      patientid: this.selectedPatientId,
      createdby: this.userInfo.created_by,
      testid: event.option.value.service_id,
      testname: event.option.value.service_type,
      price:event.option.value.price,
      isactive:true,
      islabgroup: event.option.value.is_labgroup,
      labuniqueid: this.data.patient.lab_uniqueid ? this.data.patient.lab_uniqueid : 0,
      labbillno: this.data.patient.lab_billno ? this.data.patient.lab_billno : 0,
      sampletype:event.option.value.sample_type
    });
    this.labInput.nativeElement.value = "";
    console.log(this.labs);
   
  }
  searchTestsTerm(event) {
  
    const value = event.target.value;
    const url = `api/user/GetHospitalServicesBySearch?adminid=${this.userInfo.admin_account}&searchtext=${value}&category=lab`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data && res.data.length > 0) {
          this.filteredTestsOptions$.next(res.data);
          console.log(this.filteredTestsOptions$);
        } else {
          this.filteredTestsOptions$.next([]);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  addService() {
    const addLabTests = [];
    this.labs.forEach((data: any) => {
      if (data.isactive) {
        addLabTests.push({
          paymentid: data.payment_id ? data.payment_id :0,
          patientid: data.patientid,
          appointmentid: 0,
          hospitalserviceid: data.testid,
          discountamount: 0,
          amount: parseInt(data.price),
          quantityno: 1,
          paidamount: parseInt(data.price),
          createdby: this.userInfo.user_id,
          ispercent: false,
          labuniqueid: data.labuniqueid ? data.labuniqueid.toString() : undefined,
          labbillno: data.labbillno ? data.labbillno.toString() : undefined,
          isactive: data.isactive,
          // samplecollection: "",
          // results: "",
          // result_type: "",
          verification: false,
          sampletype:data.sampletype,
          islabgroup: data.islabgroup
  
        });
      }
     
    });
    this.httpService
      .create("api/User/createPatientServiceBillsByList", addLabTests)
      .subscribe(
        (res: any) => {
          if (res?.data) {
            this.dialogRef.close(res?.data);
            // this.dismiss();
            this.snackBar.open("Test saved successfully.", "close", {
              panelClass: "snackBarSuccess",
              duration: 2000,
            });
            // if(this.data.role=='Front Desk'){
            //   this.billingModel(this.data.patient,res.data)
            // }
          
           
            
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
  TestsList:any;
  getTestsList() { 
    this.httpService
      .getAll(
        `api/Lab/GetPatienttest_bylabgroup_ForEdit?labuniqueid=${this.data.patient.lab_uniqueid}&patientid=${this.data.patient.patient_id}`
      )
      .subscribe(
        (res: any) => {
          if (res.data) {
            this.TestsList = res.data;

            // console.log(this.TestsList);
            // for (let i=0;i<this.TestsList.length;i++) {
            //   this.addTests(this.TestsList[i]);
            // } 
            let labs = [];
            this.TestsList.forEach(element => {
              console.log(element);
              labs.push({
                patientid: element.patient_id,
                createdby: this.userInfo.created_by,
                testid: element.hospital_service_id,
                testname: element.test_name,
                price:element.total_amount,
                isactive: true,
                payment_id: element.payment_id,
                labuniqueid: this.data.patient.lab_uniqueid,
                labbillno: this.data.patient.lab_billno,

              });
            });



            this.labs = labs;

          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }
  filterData(val: any) {
    this.filterVal = val;
    this.filterSubject.next(val);
  }
  clear(){
    this.labs=[]
  }
}
