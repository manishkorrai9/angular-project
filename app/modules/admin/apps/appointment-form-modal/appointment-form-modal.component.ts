import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  NgForm,
  Validators,
  FormControl,
  AbstractControl,
} from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { APIService } from "app/core/api/api";

import { map, startWith } from "rxjs/operators";

import { BehaviorSubject, Observable, of, Subject } from "rxjs";

import { BrowserDynamicTestingModule } from "@angular/platform-browser-dynamic/testing";
import moment from "moment";
import { AddPatientComponent } from '../../apps/users/add-patient/add-patient.component';

import { AuthService } from "app/core/auth/auth.service";
import { Router } from "@angular/router";
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from "@angular/material-moment-adapter";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";

export const MY_FORMATS = {
  parse: {
    dateInput: "LL",
  },
  display: {
    dateInput: "DD-MMM-YYYY",
    monthYearLabel: "YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "YYYY",
  },
};

export type PatientData = {
  patientid: number;
  details: string;
};
export type DoctorData = {
  doctorid: number;
  details: string;
};
@Component({
  selector: "app-appointment-form-modal",
  templateUrl: "./appointment-form-modal.component.html",
  styleUrls: ["./appointment-form-modal.component.scss"],
  providers: [
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AppointmentFormModalComponent implements OnInit {
  appointmentForm: FormGroup;
  patientAppointmentForm: FormGroup;
  submitted = false;
  patientData: PatientData;
  selectedPatient: string;
  accountInfo:any;
  inputText:string;
  doctorText:string;
  selectedPatientId: any;
  is_field_appear: boolean = true;
  is_requested:boolean =true;
  selectedPatient$ = new BehaviorSubject<string>(null);
  selectedDoctor: number;
  @ViewChild("appointmentNGForm") appointmentNGForm: NgForm;
  @ViewChild("patientaAppointmentNGForm") patientaAppointmentNGForm: NgForm;
  myControl = new FormControl();
  options: string[] = ["One", "Two", "Three"];
  filteredOptions: Observable<string[]>;
  filteredOptions$ = new BehaviorSubject<DoctorData[]>([]);

  filteredPatientOptions$ = new BehaviorSubject<PatientData[]>(null);

  isEditMode = false;
  patientId = "";
  appTypes: any;
  scheduleTimeList: any = [];
  isScheduleTimeListEmpty:boolean=false;
  today = moment();
  userInfo: any;
  isDoctor: boolean;
  patientUrl: boolean = true;
  Time: any;
  specialities:any [] = [];
  constructor(
    private _formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<any>,
    private httpService: APIService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    private dialog: MatDialog,
    private _matDialogRef: MatDialogRef<AppointmentFormModalComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
      console.log(this.userInfo.admin_account);
      console.log(this.userInfo.role_id);
      console.log(this.data.patient);
    this.isScheduleTimeListEmpty=true;
    this.patientAppointmentForm = new FormGroup({
      scheduleDate: new FormControl("", [Validators.required]),
      scheduleTime: new FormControl("", [Validators.required]),
      appointmentId:new FormControl("",),
      specialityid: new FormControl("", [Validators.required]),
      doctorId:new FormControl({value:'',disabled: true }, [Validators.required])
        
    });
    if(this.userInfo.admin_account == 3 && this.userInfo.role_id == 6 && !(this.router.url === "/calr/calendar")){
      this.patientAppointmentForm.get('appointmentId').clearValidators();
    }

    
    
    
    if (this.userInfo?.role_id === 5) {
      console.log(this.userInfo)
      this.isScheduleTimeListEmpty=false;
      this.isDoctor = true;
      this.getDoctorDetails();
      this.patientAppointmentForm.patchValue({scheduleDate: this.data?.patient?.next_visit_date?moment(new Date(this.data?.patient?.next_visit_date)).format("yyyy-MM-DD") :moment(new Date()).format("yyyy-MM-DD")});
      this.patientAppointmentForm.patchValue({appointmentId: '72'});
      this.addFirstEvent(moment(new Date()).format("yyyy-MM-DD"),)
    } else if(this.data.page == 'foloow-ups'){
      console.log(this.data.patient.next_visit_date)
      this.isScheduleTimeListEmpty=false;
      this.isDoctor = false;
      // this.getDoctorDetails();
      this.patientAppointmentForm.patchValue({scheduleDate: moment(new Date(this.data.patient.next_visit_date)).format("yyyy-MM-DD")});
      this.patientAppointmentForm.patchValue({appointmentId: '72'});
      this.addFirstEvent(moment(new Date(this.data.patient.next_visit_date)).format("yyyy-MM-DD"),);
      this.patientAppointmentForm.patchValue(
        {
          specialityid: this.data.patient.speciality_id,
          doctorId: this.data.patient.doctor_name
        },
      // this.selectedPatientId=
    );
    }
      else {
      this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
      this.isDoctor = false;
     
    }

   console.log(this.data.page )
    
    if (this.router.url === "/apps/patients") {
      this.patientUrl = true;
    }else  if (this.router.url === "/dashboard") {
      this.patientUrl = true;
      if(this.data.page == 'InProcess' && (this.userInfo.admin_account == 3 || this.userInfo.role_id == 6)){
        this.is_field_appear=false;
        this.is_requested = false;
      }
    }
    else  if (this.router.url === "/calr/calendar" && this.data.page != 'edit') {
      this.patientUrl = true;
      this.is_requested = true;
     
    }
    else if(this.data.page == 'InProcess' || this.data.page == 'Enroll' || this.data.page=='unsubscribed') {
      this.patientUrl = true; 
      this.is_field_appear=false;
      this.clearDoctorId();
    }
    else if(this.data.page == 'Reschedule' || this.data.page == 'edit') {
      this.patientUrl = false;   
    }
    console.log(this.is_field_appear);
    //  else {
    //   this.patientUrl = false;
    //   this.is_field_appear=true
    // }

    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(""), 
      map((value) => this._filter(value))
    );
    this.getMasterDataInfo();
    // this.getSchedukeTimes();
    if (this.data && this.data.appointmentdata) {
      this.isEditMode = true;
     
    } 

    this.patientId = this.data.patient ? this.data.patient.user_id : 0;
    
    if (this.patientId) {
      this.selectedPatientId = this.patientId;
      this.selectedPatient$.next(this.data?.patient?.first_name + ' ' + this.data?.patient?.last_name + ' - ' + this.data?.patient?.age+'yrs'+ ' - ' +this.data?.patient?.gender );

    }else if(this.data.page == 'foloow-ups'){
      this.selectedPatientId = this.data?.patient?.patient_id;
      this.selectedPatient$.next(this.data.patient.first_name + ' ' + this.data?.patient?.last_name + ' - ' + this.data?.patient?.age+'yrs'+ ' - ' +this.data?.patient?.gender );
    }
      else{
      this.selectedPatientId = this.data?.patient?.patient_id;
      this.selectedPatient$.next(this.data.patient.full_name + ' - ' + this.data?.patient?.age+'yrs'+ ' - ' +this.data?.patient?.gender);
    }



    this.appointmentForm = new FormGroup({
      appId:
        this.userInfo?.role_id === 5
          ? new FormControl("")
          : new FormControl("", [Validators.required]),
      scheduleTime: new FormControl({ value: "", disabled: true }),
      scheduleDate: new FormControl({ value: "", disabled: true }),
      rescheduleDate: new FormControl("", [Validators.required]),
      rescheduleTime: new FormControl("", [Validators.required]),
      specialityid: new FormControl("", [Validators.required]),
      doctorId:new FormControl({value:'',disabled: true }, [Validators.required])
    });

    if (this.data && this.data.appointmentdata) {
      this.appointmentForm.patchValue({
        appId: this.data.appointmentdata.doctor_name,
        scheduleDate: this.data.appointmentdata.appointment_date,
        scheduleTime: this.data?.appointmentdata
          ? this.data.appointmentdata.appointment_date
          : "",
      });
    }
    if (this.userInfo.role_id == 481 || this.userInfo.role_id == 474) {
        this.appointmentForm.controls.doctorId.enable();
    }
    
  }

  

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  getDoctorDetails() {
    console.log('boooook')
    this.httpService.get("api/User/GetUsersById?userId=", this.userInfo?.user_id).subscribe(
      (res: any) => {
        this.accountInfo = res.data;
        this.patientAppointmentForm.patchValue(
          {
            specialityid: this.accountInfo.speciality_id,
            doctorId: this.accountInfo.isadmin_account ?(this.accountInfo.contactperson_name): (this.accountInfo.full_name)
          },
      );

      if (this.router.url == "/calr/calendar" && this.data.page == 'edit') {
        
        this.appointmentForm.patchValue(
          {
            specialityid: this.accountInfo.speciality_id,
            doctorId: this.accountInfo.isadmin_account ?(this.accountInfo.contactperson_name): (this.accountInfo.full_name)
          },
        );
      }

      

      this.patientAppointmentForm.controls['doctorId'].disable();


      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  searchDoctors(value) {

    if(this.userInfo?.role_id === 5) {
      const url = `api/Doctor/SearchDoctor?searchText=${value}&mainbranchid=${this.userInfo.admin_account}&ismainbranch=true&specialityid=${this.patientAppointmentForm.controls.specialityid.value}`;
      this.httpService.getAll(url).subscribe(
        (res: any) => {
          if (res.data && res.data.length > 0) {
            this.filteredOptions$.next(res.data);
           
          } else {
            this.filteredOptions$.next([]);
          
          }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    } else {
      let specialityid;
      if(this.router.url === "/calr/calendar" && this.data.page == 'edit') {
        specialityid = this.appointmentForm.controls.specialityid.value;
      } else  {
        specialityid = this.patientAppointmentForm.controls.specialityid.value;
      }
      const url = `api/User/GetCoordinatorTeam?userid=${this.userInfo?.user_id}&searchtext=${value}&specialityid=${specialityid}&issecondopinion=${this.userInfo.admin_account == 3 ? true : false}`;
      this.httpService.getAll(url).subscribe(
        (res: any) => {
          if (res.data && res.data.length > 0) {
            this.filteredOptions$.next(res.data);
          } else {
            this.filteredOptions$.next([]);
           
          }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    }
    


   
  }

  onSelectionChange(event: any) {
   
    // this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
    // this.patientAppointmentForm.controls.scheduleDate.setValue(undefined);
    this.selectedDoctor = event.option.id;
    this.patientAppointmentForm.controls['doctorId'].disable();

    this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
    this.patientAppointmentForm.controls.scheduleDate.setValue(undefined);
    // this.isScheduleTimeListEmpty=true;
    //this.getSchedukeTimes();
  }

  onSearchTerm(event) {
    this.doctorText = event.target.value;
    this.searchDoctors(event.target.value);
  }


  onSearchPatient(event) {
    this.inputText = event.target.value;
    this.searchpatientsData(event.target.value);
  }

  searchpatientsData(value) {
    const url = `api/Doctor/SearchPatients?searchText=${value}&userid=${this.userInfo.user_id}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
          if(res.data && res.data.length > 0){
            this.filteredPatientOptions$.next(res.data);
          }
          else {
            this.filteredPatientOptions$.next([]);
           
          }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  onSelectionChangePatient(event, value) {
       
    if(event !== null && event?.option?.value !== undefined) {
      this.selectedPatient$.next(event.option.value);
      this.selectedPatientId=event?.option.id;
    }
    this.selectedPatientId = event?.option?.id !== undefined ? event?.option?.id : value;

  }


  clearReports() {
    this.inputText = undefined;
    this.selectedPatientId = undefined;
    this.scheduleTimeList=[];
    this.selectedPatient$.next(null);
  }

  clearDoctorId() {
    
    this.doctorText = undefined;
    this.selectedDoctor = undefined;
    this.patientAppointmentForm.controls['doctorId'].setValue(undefined);
    this.patientAppointmentForm.controls['doctorId'].enable();
  }


  getMasterDataInfo() {
    console.log(this.userInfo)
    const url = `api/User/GetMasterData?mastercategoryid=24`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.appTypes = res.data;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
    if(this.userInfo?.admin_account === 3){
      // const url2 = `api/User/GetMasterData_HLKD?appname=`+'HLKD';
       
      // this.httpService.getAll(url2).subscribe((res: any) => {  
      //     this.specialities=res.data;
      //     this.getDoctorDetails();
          
      // },
      // (error: any) => {
      //     console.log('error', error);
      // });
      const url = `api/Doctor/GetDoctorSpecialitiesForHospitals?adminid=${this.userInfo?.admin_account}`;
      this.httpService.getAll(url).subscribe((res: any) => {
        this.specialities=res.data;
      
        if (this.userInfo?.role_id === 5) {
          this.getDoctorDetails();
        } 
      });
      

    }
    else{
      const url = `api/Doctor/GetDoctorSpecialitiesForHospitals?adminid=${this.userInfo?.admin_account}`;
      this.httpService.getAll(url).subscribe((res: any) => {
        this.specialities=res.data;
      
        if (this.userInfo?.role_id === 5) {
          this.getDoctorDetails();
        }
        // console.log(res.data)
        // if ( res.data && res.data.length !== 0 ) {
        //   console.log(res.data);
        // }
      });
    //   const url2 = `api/User/GetMasterData?mastercategoryid=`+21;
       
    // this.httpService.getAll(url2).subscribe((res: any) => {
    //     this.specialities=res.data;
      
    //     if (this.userInfo?.role_id === 5) {
    //       this.getDoctorDetails();
    //     }
    // },
    // (error: any) => {
    //     console.log('error', error);
    // });
    }

    



  }

  

  getSchedukeTimes() {

    let doctorId:any;

    if (this.userInfo?.role_id != 5) {
      doctorId = this.selectedDoctor;
    } else {
      doctorId = this.userInfo?.user_id;
    }
    console.log(doctorId);
    const url = `api/Patient/GetTodayDoctorSlots?doctorid=${doctorId}`;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.scheduleTimeList = (res.data).reverse();
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  checkAppointment(
    patientId: any,
    doctorId: any,
    date: any
  ): Observable<boolean> {
    var subject = new Subject<boolean>();

    const url = `api/Doctor/GetPatientCurrentDateAppointmentExists?patient=${patientId}&doctorid=${doctorId}&currentdate=${date}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        subject.next(res.data);
      },
      (error: any) => {
        subject.next(true);
      }
    );
    return subject.asObservable();
  }

  saveRescheduleAppt() {
    
    if(this.data.page == 'Reschedule' || this.data.page == 'edit'){

      let appointment_id = this.data.patient && this.data.patient.calender_id ?  this.data.patient.calender_id : this.data.patient.appointment_id;
      this.Time = moment(this.appointmentForm.controls.rescheduleTime.value, [
        "h:mm A",
      ]).format("HH:mm");
     
      const url = `api/Doctor/RescheduleAppointment?appointmentid=${appointment_id}&statusid=8&scheduletime=${ moment(this.appointmentForm.controls.rescheduleDate.value).format("YYYY-MM-DD") + `T${this.Time}:00.000`}`;
      this.httpService.create(url, {}).subscribe((res: any) => {
        this.dialogRef.close(true);
        this.snackBar.open("Appointment Rescheduled successfully. ", "close", {
          panelClass: "snackBarSuccess",
          duration: 2000,
        });
      },(error: any) => {
        console.warn("error", error);
      })
    
      
    }else{
     
      const url = `api/Doctor/BookAppointment`;
      this.Time = moment(this.appointmentForm.controls.rescheduleTime.value, [
        "h:mm A",
      ]).format("HH:mm");
      const body = {
        calenderid: this.isEditMode ? this.data.appointmentdata.calender_id : 0,
        patientid: this.data.appointmentdata.patient_id,
        scheduledate:
          moment(this.appointmentForm.controls.rescheduleDate.value).format(
            "YYYY-MM-DD"
          ) + `T${this.Time}:00.000`,
        doctorid: this.selectedDoctor
          ? this.selectedDoctor
          : this.data.appointmentdata.doctor_id,
        statusid: 8,
        totalamount:"0",
        scheduletypeid: 72,
        descriptionname: "",
        createdby: this.userInfo?.user_id,
        appointmentid: this.isEditMode
          ? this.data.appointmentdata.appointment_typeid
          : 0,
        nextvisit: "",
        scheduledby: this.userInfo?.user_id,
      };
      this.httpService.create(url, body).subscribe(
        (res: any) => {
          this.dialogRef.close(true);
          this.snackBar.open("Appointment Rescheduled successfully. ", "close", {
            panelClass: "snackBarSuccess",
            duration: 2000,
          });
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    }
    
  }

  dismiss() {
    this._matDialogRef.close();
  }

  savePatientSideAppt() {
    this.Time = moment(
      this.patientAppointmentForm.controls.scheduleTime.value,
      ["h:mm A"]
    ).format("HH:mm");
    let date =
      moment(this.patientAppointmentForm.controls.scheduleDate.value).format(
        "YYYY-MM-DD"
      ) + `T${this.Time}:00.000`;

    let doctorId = this.isDoctor ? this.userInfo?.user_id : this.selectedDoctor;

    if (this.data.page=='unsubscribed' || (this.router.url === "/apps/request" && this.data.page != 'Enroll') || this.data.page == 'InProcess') {
      const url = `api/User/Update_patient_appointment_request`;
      const body = {
        actiondone_by: this.userInfo?.user_id,
        request_status: "Booked Appointment",
        note: "",
        actiondone_on: this.today,
        request_id: this.data.patient.request_id, 
        patientid: this.selectedPatientId,
        doctorid: doctorId,
        scheduledate: date,
        appointment_category: this.data && this.data.appointment_category ? this.data.appointment_category: undefined
      };

      this.checkAppointment(this.selectedPatientId, doctorId, date).subscribe(
        (res: any) => {
          if (!res) {
            this.httpService.create(url, body).subscribe(
              (res: any) => {
                this.dialogRef.close(true);
                this.snackBar.open(
                  "Appointment added successfully. ",
                  "close",
                  {
                    panelClass: "snackBarSuccess",
                    duration: 2000,
                  }
                );
              },
              (error: any) => {
                console.log("error", error);
              }
            );
          } else {
            this.snackBar.open(
              "Your appointment already scheduled by given date. ",
              "close",
              {
                panelClass: "snackBarWarning",
                duration: 2000,
              }
            );
          }
        },
        (error: any) => {
          console.log(error);
        }
      );
    }
    else if(this.data.page =='foloow-ups'){
      const url = `api/Doctor/BookAppointment`; 
      const body = {
        calenderid: this.data.patient.calender_id,
        patientid: this.data.patient.patient_id,
        scheduledate: date,
        doctorid: this.data.patient.doctor_id,
        statusid: 8,
        totalamount: "0",
        // this.data.page == 'Reschedule' || this.data.page == 'InProcess'
        scheduletypeid: 72,
        descriptionname: "",
        createdby: this.userInfo?.user_id,
        appointmentid: 0,
        nextvisit: "",
        appointment_category: "Follow-up"
      };

      this.checkAppointment(this.selectedPatientId, doctorId, date).subscribe(
        (res: any) => {
          if (!res) {
            this.httpService.create(url, body).subscribe(
              (res: any) => {
                this.dialogRef.close(true);
                this.snackBar.open(
                  "Appointment added successfully. ",
                  "close",
                  {
                    panelClass: "snackBarSuccess",
                    duration: 2000,
                  }
                );
              },
              (error: any) => {
                console.log("error", error);
              }
            );
          } else {
            this.snackBar.open(
              "Your appointment already scheduled by given date. ",
              "close",
              {
                panelClass: "snackBarWarning",
                duration: 2000,
              }
            );
          }
        },
        (error: any) => {
          console.log(error);
        }
      );

    } 
    else if(this.router.url === "/calr/calendar" || this.data.page=='clintel'){
      
      const url = `api/Doctor/BookAppointment`; 
      const body = {
        calenderid: this.isEditMode ? this.data.appointmentdata.calender_id : 0,
        patientid: this.selectedPatientId,
        scheduledate: date,
        doctorid: doctorId,
        statusid: 8,
        totalamount: "0",
        // this.data.page == 'Reschedule' || this.data.page == 'InProcess'
        scheduletypeid: (this.data.page == 'Reschedule' || this.data.page == 'InProcess' || this.data.page == 'Enroll') ? 73: parseInt(this.patientAppointmentForm.controls.appointmentId.value),
        descriptionname: "",
        createdby: this.userInfo?.user_id,
        appointmentid: 0,
        nextvisit: "",
        appointment_category: this.data && this.data.appointment_category ? this.data.appointment_category: undefined
      };

      this.checkAppointment(this.selectedPatientId, doctorId, date).subscribe(
        (res: any) => {
          if (!res) {
            this.httpService.create(url, body).subscribe(
              (res: any) => {
                this.dialogRef.close(true);
                this.snackBar.open(
                  "Appointment added successfully. ",
                  "close",
                  {
                    panelClass: "snackBarSuccess",
                    duration: 2000,
                  }
                );
              },
              (error: any) => {
                console.log("error", error);
              }
            );
          } else {
            this.snackBar.open(
              "Your appointment already scheduled by given date. ",
              "close",
              {
                panelClass: "snackBarWarning",
                duration: 2000,
              }
            );
          }
        },
        (error: any) => {
          console.log(error);
        }
      );
    }else if(this.router.url === "/apps/second-opinion-subscriptions" || this.router.url === "/apps/kidney-care-subscriptions"){
      
      const url = `api/User/Book_patient_appointment_directly`;
      const body = {
        "actiondone_by": this.userInfo?.user_id,
        "note": "",
        "actiondone_on": this.today,
        "opinion_id": this.data.patient.opinion_id,
        "patientid": this.selectedPatientId,
        "doctorid": doctorId,
        "scheduledate": date,
        appointment_category: this.data && this.data.appointment_category ? this.data.appointment_category: undefined
      };

      this.checkAppointment(this.selectedPatientId, doctorId, date).subscribe(
        (res: any) => {
          if (!res) {
            this.httpService.create(url, body).subscribe(
              (res: any) => {
                console.log(res.data);
                this.dialogRef.close(res.result.data);
                this.snackBar.open(
                  "Appointment added successfully. ",
                  "close",
                  {
                    panelClass: "snackBarSuccess",
                    duration: 2000,
                  }
                );
              },
              (error: any) => {
                console.log("error", error);
              }
            );
          } else {
            this.snackBar.open(
              "Your appointment already scheduled by given date. ",
              "close",
              {
                panelClass: "snackBarWarning",
                duration: 2000,
              }
            );
          }
        },
        (error: any) => {
          console.log(error);
        }
      );
    }
  }
  events: string[] = [];
  date: any;
  addEvent(date, event: MatDatepickerInputEvent<Date>) {

    let userId =  this.userInfo.user_id;
   
    if (this.userInfo?.role_id != 5) {
      userId = this.selectedDoctor;
    }

    this.isScheduleTimeListEmpty=false;
    this.appointmentForm.controls.rescheduleTime.setValue(undefined);
    this.date = moment(
      this.appointmentForm.controls.rescheduleDate.value
    ).format("yyyy-MM-DD");
    const url = `api/patient/GetDoctorAvailableSlots_bydate?doctorid=${userId}&slotdate=${this.date}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.scheduleTimeList = res.data;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
    // this.events.push(`${event.value}`);
   
  }
  addFirstEvent(date?:any, event?: MatDatepickerInputEvent<Date>) {
    
   
    let userId =  this.userInfo.user_id;
   
    if (this.userInfo?.role_id != 5) {
      userId = this.selectedDoctor;
    }

    this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
    this.date = moment(
      this.patientAppointmentForm.controls.scheduleDate.value
    ).format("yyyy-MM-DD");
    const url = `api/patient/GetDoctorAvailableSlots_bydate?doctorid=${this.data.page=='foloow-ups'?this.data.patient.doctor_id:userId}&slotdate=${this.date}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.isScheduleTimeListEmpty=false;
        this.scheduleTimeList = res.data.sort(function (a, b) {
          return new Date('1970/01/01 ' + a).valueOf() - new Date('1970/01/01 ' + b).valueOf();
        });;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
    // this.events.push(`${event.value}`);
   
  }

  changeSpeciality(value:any) {
    
    this.patientAppointmentForm.controls.doctorId.enable();
    this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
    this.patientAppointmentForm.controls.doctorId.setValue(undefined);
    this.filteredOptions$.next([]);
  }

  addPatient() {
    this._matDialogRef.close();
    this.router.navigateByUrl('/dashboard', {state:{newPatient:true}})
  }
  clearFields(){
    this.patientAppointmentForm.controls.scheduleTime.setValue(undefined);
    this.patientAppointmentForm.controls.scheduleDate.setValue(undefined);
    this.patientAppointmentForm.controls.appointmentId.setValue(undefined);
  }
}
