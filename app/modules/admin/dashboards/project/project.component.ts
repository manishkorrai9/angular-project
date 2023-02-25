import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Router } from "@angular/router";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { BehaviorSubject, Subject } from "rxjs";
import { takeUntil, debounceTime, map, switchMap } from "rxjs/operators";
import { ApexOptions } from "ng-apexcharts";
import { fuseAnimations } from "@fuse/animations";
import { ProjectService } from "app/modules/admin/dashboards/project/project.service";
import { APIService } from "app/core/api/api";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "app/core/auth/auth.service";
import {
  FormGroup,
  NgForm,
  FormBuilder,
  Validators,
  FormControl,
} from "@angular/forms";
import * as XLSX from "xlsx";
import { MatDialog } from "@angular/material/dialog";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from "@angular/material-moment-adapter";
import { AppointmentFormModalComponent } from "../../apps/appointment-form-modal/appointment-form-modal.component";
import { LabBillingComponent } from "../../lab/lab-billing/lab-billing.component";

import moment from "moment";
import { AddPatientComponent } from "../../apps/users/add-patient/add-patient.component";
import { FuseConfirmationService } from "@fuse/services/confirmation";
import { LabTestsComponent } from "../../lab/lab-tests/lab-tests.component";
import { AddIpModalComponent } from "../../apps/add-ip-modal/add-ip-modal.component";
import { ReasonForCancelComponent } from "../../apps/calendar/reason-for-cancel/reason-for-cancel.component";
declare var hbspt: any;
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

@Component({
  selector: "project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.scss"],
 
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
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;

  userInfo: any;
  patients$ = new BehaviorSubject<any>(null);
  pageSize = 5;
  currentPage = 0;
  filterVal = "";
  filterSubject = new Subject();
  totalRecords$ = new BehaviorSubject<any>(null);
  requestedPatients$ = new BehaviorSubject<any>(null);
  requestedTotalRecords$ = new BehaviorSubject<any>(null);
  fromDate: Date;
  dateForm: FormGroup;
  sortDirection = "";
  sortBy = "";
  fileName = "Patients.xlsx";
  uploadData: any = [];
  doctors: any = [];
  searchedTerm:string = "";
  patientsInfoOptions: ApexOptions = {};
  chartTaskDistribution: ApexOptions = {};
  chartBudgetDistribution: ApexOptions = {};
  chartWeeklyExpenses: ApexOptions = {};
  chartMonthlyExpenses: ApexOptions = {};
  chartYearlyExpenses: ApexOptions = {};
  doctorsOptions: ApexOptions;
  careTeamOptions: ApexOptions;
  data: any;
  selectedProject: string = "ACME Corp. Backend App";
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  dashBoardInfo$ = new BehaviorSubject<any>(null);
  secondOpinionCountInfo$ = new BehaviorSubject<any>(null);
  overviewData: any;
  selectedPatientInfoType = "week";
  weeklyPatientInfo: any;
  monthlyPatientInfo: any;
  yearlyPatientInfo: any;
  patientsCount$ = new BehaviorSubject<any>(null);
  selectedDoctorInfoType = "week";
  doctorsInfo: any;
  // selectedDoctor: any = 'all';
  selectedDoctor: any;
  monthlyDoctorsInfo: any;
  yearlyDoctorsInfo: any;
  selectedCareTeamType = "week";
  doctorsCount$ = new BehaviorSubject<any>(null);
  careTeamCount$ = new BehaviorSubject<any>(null);

  accountInfo = new BehaviorSubject<any>(null);

  constructor(
    private _projectService: ProjectService,
    private _matDialog: MatDialog,
    private _router: Router,
    private httpService: APIService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private _fuseConfirmationService: FuseConfirmationService
  ) {
    this.userInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
    console.log(this.userInfo);
    this.getSecondOpinionCount()
    if(this.userInfo.admin_account == 3 || this.userInfo.role_id == 6){
      this.selectedDoctor=3;
    }else{
      this.selectedDoctor = this.userInfo.user_id
    }
    // this.getDashboardCount();
    // console.log(sessionStorage.getItem('accessToken'))
    this.initForm();
    this.newGetPatientsInfo();
    this.GetRequestedPatientsInfo();
    this.filterSubject
      .pipe(
        debounceTime(500),
        map((val) => {
          if(this.userInfo.admin_account == 3 && (this.userInfo.role_id == 6 || this.userInfo.role_id == 4)){
            this.GetRequestedPatientsInfo();
          }else{
            this.newGetPatientsInfo();
          }
          
        })
      )
      .subscribe();

    if (this.userInfo.role_id == 5 || this.userInfo.admin_account == 3) {
      this.getDashboardCount();
    } else {
      this.getDoctorsList();
    }

    this.getDashboadInfo();
    this.getUserInfo(this.userInfo.user_id);

    // Get the data
    this._projectService.data$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {
        // Store the data
        this.data = data;
      });

    // Attach SVG fill fixer to all ApexCharts
    window["Apex"] = {
      chart: {
        events: {
          mounted: (chart: any, options?: any): void => {
            this._fixSvgFill(chart.el);
          },
          updated: (chart: any, options?: any): void => {
            this._fixSvgFill(chart.el);
          },
        },
      },
    };
  }

  initForm() {
    this.dateForm = this.fb.group({
      fromDate: [""],
      toDate: [""],
    });
    this.dateForm.valueChanges.subscribe((data: any) => {
      this.newGetPatientsInfo();
    });

    this.dateForm.valueChanges.subscribe((data: any) => {
      this.newGetPatientsInfo();
    });

    if (history.state && history.state.newPatient) {
      this.addPatient();
    }
  }

  ngAfterViewInit(): void {}

  newGetPatientsInfo() {
    const url = `api/User/GetHospitalbasedUsers`;
    const body = {
      roleid: 3,
      pageSize: this.pageSize,
      pageNo: this.currentPage + 1,
      searchtext: this.filterVal,
      clinicid: this.userInfo.admin_account,
      ismainbranch: true,
      fromdate: this.dateForm.get("fromDate").value
        ? moment(this.dateForm.get("fromDate").value).format("YYYY-MM-DD")
        : null,
      todate: this.dateForm.get("toDate").value
        ? moment(this.dateForm.get("toDate").value).format("YYYY-MM-DD")
        : null,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      userid: this.userInfo.user_id,
    };
    this.httpService.create(url, body).subscribe((res: any) => {
      this.patients$.next(res.data.userdata);
      console.log(this.patients$);
      this.totalRecords$.next(res.data.totalrecords);
    });
  }

  onPageChange(index: any) {
    this.currentPage = index.pageIndex;
    this.pageSize = index.pageSize;
    this.newGetPatientsInfo();
  }
  onRequestPageChange(index: any){
    this.currentPage = index.pageIndex;
    this.pageSize = index.pageSize;
    this.GetRequestedPatientsInfo();
  }

  filterData(val: any) {
    this.filterVal = val;
    this.filterSubject.next(val);
  }

  sortData(event: any) {
    this.sortBy = event.active;
    this.sortDirection = event.direction;
    this.newGetPatientsInfo();
  }

  downloadData() {
    this.getAllRecords();
  }

  getAllRecords() {
    const url = `api/User/GetHospitalbasedUsers`;
    const body = {
      roleid: 3,
      allrecords: true,
      pageSize: 0,
      pageNo: 0,
      searchtext: "",
      fromdate: null,
      todate: null,
      sortBy: "",
      sortDirection: "",
      userid: this.userInfo.user_id,
    };
    this.httpService.create(url, body).subscribe((res: any) => {
      const usersData = res.data?.userdata;
      if (usersData.length > 0) {
        let patientId = "Patient Id";
        let personalInfo = "Personal Info";
        let phoneNumber = "Phone Number";
        // let riskCondition = "Risk/Condition";
        let rigisterDate = "Register Date";
        const headers = [
          patientId,
          personalInfo,
          phoneNumber,
          // riskCondition,
          rigisterDate,
        ];
        this.uploadData.push(headers);
        let i = 0;
        usersData.map((data: any) => {
          patientId = "HK00000" + (i + 1);
          personalInfo =
            data.first_name +
            " " +
            data.last_name +
            "," +
            data.age +
            "yrs," +
            data.gender;
          phoneNumber = data.mobile_no;
          // riskCondition = '--';
          rigisterDate = data.created_on;
          const importData = [
            patientId,
            personalInfo,
            phoneNumber,
            // riskCondition,
            rigisterDate,
          ];
          this.uploadData.push(importData);
        });
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.uploadData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, this.fileName);
        this.uploadData = [];
      }
    });
  }
  // bookAppointment(det){
  //   console.log(det)

  // }
  bookAppointment(data,applicationType?:string) {
    this.dialog
      .open(AppointmentFormModalComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { patient: data, page: applicationType},
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          console.log(this.selectedDoctor)
          this.getDashboardCountforAll();
          // this.getAllComplaintByUserId();
        }
      });
  }

  setDisplayPrescription() {
    localStorage.setItem("displayPrescription", "patients");
  }

  addSpace(data: any) {
    const formatText = data.match(/.{1,5}/g);
    return formatText.join(" ");
  }

  addPatient() {
    this.dialog
      .open(AddPatientComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "patient-reg-form",
        position: { right: "0" },
        // data: { patientid: data?.user_id,  },
      })
      .afterClosed()
      .subscribe((data) => {
        console.log(data);
        if (data) {
        
          if (typeof data === 'object' && data !== null) {
            if (data.search) {
              this.searchedTerm = data.first_name;
              this.filterData(data.first_name);
            } else {
              this.newGetPatientsInfo();
              this.getDashboardCount();
            }
          } else {
            this.newGetPatientsInfo();
            this.getDashboardCount();
          }
          
        }
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private _fixSvgFill(element: Element): void {
    // Current URL
    const currentURL = this._router.url;

    // 1. Find all elements with 'fill' attribute within the element
    // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
    // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
    Array.from(element.querySelectorAll("*[fill]"))
      .filter((el) => el.getAttribute("fill").indexOf("url(") !== -1)
      .forEach((el) => {
        const attrVal = el.getAttribute("fill");
        el.setAttribute(
          "fill",
          `url(${currentURL}${attrVal.slice(attrVal.indexOf("#"))}`
        );
      });
  }

  getDashboardCount(userId?:any) {
    let selectedDoctor = this.userInfo.user_id;
    if (userId) {
      selectedDoctor = userId;
    }  else if(this.userInfo.role_id != 5) {
      selectedDoctor = this.selectedDoctor;
    }
    const url = `api/Doctor/GetDashboardAppointmentCount?doctorid=${selectedDoctor}`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.dashBoardInfo$.next(res.data);
      console.log(this.dashBoardInfo$);
    });
  }

  getSecondOpinionCount() {
    
    const url = `api/Doctor/GetDashboardSOPKidneycareAppointmentCount`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.secondOpinionCountInfo$.next(res.data);
      console.log(this.dashBoardInfo$);
    });
  }

  getDashboardCountforAll(userId?:any) {
    const url = `api/Doctor/GetDashboardAllAppointmentCount_ByCoordinator?coordinatorid=${this.userInfo.user_id}`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.dashBoardInfo$.next(res.data);
      console.log(this.dashBoardInfo$);
    });
  }

  getDashboadInfo() {
    const url = `api/User/GetDashboardStatistics`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.weeklyPatientInfo = res.data.patient_info_weekly_registration_graph;
      this.monthlyPatientInfo =
        res.data.patient_info_monthly_registration_graph;
      this.yearlyPatientInfo = res.data.patient_info_yearly_registration_graph;
      this.overviewData = res.data;
      this.doctorsInfo = res.data.doctor_weekly_registration_graph;
      this.patientsCount$.next(res.data.weekly_counts);
      this.doctorsCount$.next(
        this.overviewData.doctor_weekly_registration_graph
      );
      this.careTeamCount$.next(
        this.overviewData.careteam_weekly_registration_graph
      );
      this.getPatientsInfo(this.selectedPatientInfoType);
      this.getDoctorsInfo(this.selectedDoctorInfoType);
      this.getCareTeamInfo(this.selectedCareTeamType);
    });
  }

  onPatientChange(value: any) {
    this.getPatientsInfo(value);
  }

  onDoctorChange(key: any) {
    if (key.value === 'all') {
      this.selectedDoctor =this.userInfo.user_id;
      this.getDashboardCountforAll();
    }
    else {
      this.selectedDoctor = key.value ? key.value: this.userInfo.user_id;
    if (key.value) {
      sessionStorage.setItem('sessionDoctorId', key.value)
    }
    this.getDashboardCount(this.selectedDoctor);
    }
  }

  onCareTeamChange(value: any) {
    this.getCareTeamInfo(value);
  }

  getPatientsInfo(type: string) {
    let filterData = [];
    if (type === "week") {
      filterData = this.weeklyPatientInfo ? this.weeklyPatientInfo : [];
      this.patientsCount$.next(this.overviewData.weekly_counts);
    }
    if (type === "month") {
      filterData = this.monthlyPatientInfo ? this.monthlyPatientInfo : [];
      this.patientsCount$.next(this.overviewData.monthly_counts);
    }
    if (type === "year") {
      filterData = this.yearlyPatientInfo ? this.yearlyPatientInfo : [];
      this.patientsCount$.next(this.overviewData.yearly_counts);
    }
    let key = type;
    let series = {};
    series[key] = [
      {
        data: [],
        name: "Patients",
      },
    ];
    let chartData = {
      labels: [],
      series: series,
    };
    filterData.forEach((data) => {
      chartData.labels.push(data.type_name);
      chartData.series[key][0].data.push(data.patient_count);
      return chartData;
    });
    this.getPatientsOverviewInfo(chartData);
  }

  getPatientsOverviewInfo(info: any) {
    this.patientsInfoOptions = {
      chart: {
        fontFamily: "inherit",
        foreColor: "inherit",
        height: "100%",
        type: "line",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      colors: ["#64748B", "#94A3B8"],
      dataLabels: {
        enabled: true,
        enabledOnSeries: [0],
        background: {
          borderWidth: 0,
        },
      },
      grid: {
        borderColor: "var(--fuse-border)",
      },
      labels: info.labels,
      legend: {
        show: false,
      },
      plotOptions: {
        bar: {
          columnWidth: "50%",
        },
      },
      series: info.series,
      states: {
        hover: {
          filter: {
            type: "darken",
            value: 0.75,
          },
        },
      },
      stroke: {
        width: [3, 0],
      },
      tooltip: {
        followCursor: true,
        theme: "dark",
      },
      xaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          color: "var(--fuse-border)",
        },
        labels: {
          style: {
            colors: "var(--fuse-text-secondary)",
          },
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          offsetX: -16,
          style: {
            colors: "var(--fuse-text-secondary)",
          },
        },
      },
    };
  }

  getDoctorsList() {
    const url = `api/User/GetCoordinatorTeam?userid=${this.userInfo.user_id}`;

    this.httpService.getAll(url).subscribe((res: any) => {
      this.doctors = res.data ? res.data : [];
      this.getDashboardCountforAll();
    });
  }

  getDoctorsInfo(type: string) {
    let filterData = [];
    if (type === "week") {
      filterData = this.overviewData.doctor_weekly_registration_graph
        ? this.overviewData.doctor_weekly_registration_graph
        : [];
      this.doctorsCount$.next(
        this.overviewData.doctor_weekly_registration_graph
      );
    }
    if (type === "month") {
      filterData = this.overviewData.doctor_monthly_registration_graph
        ? this.overviewData.doctor_monthly_registration_graph
        : [];
      this.doctorsCount$.next(
        this.overviewData.doctor_monthly_registration_graph
      );
    }
    if (type === "year") {
      filterData = this.overviewData.doctor_yearly_registration_graph
        ? this.overviewData.doctor_yearly_registration_graph
        : [];
      this.doctorsCount$.next(
        this.overviewData.doctor_yearly_registration_graph
      );
    }
    let chartData = {
      labels: [],
      series: [],
    };
    filterData.forEach((data) => {
      chartData.labels.push(data.type_name);
      chartData.series.push(data.percentage);
      return chartData;
    });
    this.getDoctorsOverviewInfo(chartData);
  }

  getDoctorsOverviewInfo(data: any) {
    this.doctorsOptions = {
      chart: {
        animations: {
          speed: 400,
          animateGradually: {
            enabled: false,
          },
        },
        fontFamily: "inherit",
        foreColor: "inherit",
        height: "100%",
        type: "donut",
        sparkline: {
          enabled: true,
        },
      },
      colors: ["#316635", "#f29f33", "#e94243"],
      labels: data.labels,
      plotOptions: {
        pie: {
          customScale: 0.9,
          expandOnClick: false,
          donut: {
            size: "70%",
          },
        },
      },
      series: data.series,
      states: {
        hover: {
          filter: {
            type: "none",
          },
        },
        active: {
          filter: {
            type: "none",
          },
        },
      },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        theme: "dark",
        custom: ({
          seriesIndex,
          w,
        }): string => `<div class='flex items-center h-8 min-h-8 max-h-8 px-3'>
                                                    <div class='w-3 h-3 rounded-full' style='background-color: ${w.config.colors[seriesIndex]};'></div>
                                                    <div class='ml-2 text-md leading-none'>${w.config.labels[seriesIndex]}:</div>
                                                    <div class='ml-2 text-md font-bold leading-none'>${w.config.series[seriesIndex]}%</div>
                                                </div>`,
      },
    };
  }

  getCareTeamInfo(type: string) {
    let filterData = [];
    if (type === "week") {
      filterData = this.overviewData.careteam_weekly_registration_graph
        ? this.overviewData.careteam_weekly_registration_graph
        : [];
      this.doctorsCount$.next(
        this.overviewData.careteam_weekly_registration_graph
      );
    }
    if (type === "month") {
      filterData = this.overviewData.careteam_monthly_registration_graph
        ? this.overviewData.careteam_monthly_registration_graph
        : [];
      this.doctorsCount$.next(
        this.overviewData.careteam_monthly_registration_graph
      );
    }
    if (type === "year") {
      filterData = this.overviewData.careteam_yearly_registration_graph
        ? this.overviewData.careteam_yearly_registration_graph
        : [];
      this.doctorsCount$.next(
        this.overviewData.careteam_yearly_registration_graph
      );
    }
    let chartData = {
      labels: [],
      series: [],
    };
    filterData.forEach((data) => {
      chartData.labels.push(data.type_name);
      chartData.series.push(data.percentage);
      return chartData;
    });
    this.getCareteamOverviewInfo(chartData);
  }

  getCareteamOverviewInfo(data: any) {
    this.careTeamOptions = {
      chart: {
        animations: {
          speed: 400,
          animateGradually: {
            enabled: false,
          },
        },
        fontFamily: "inherit",
        foreColor: "inherit",
        height: "100%",
        type: "donut",
        sparkline: {
          enabled: true,
        },
      },
      colors: ["#316635", "#f29f33", "#e94243"],
      labels: data.labels,
      plotOptions: {
        pie: {
          customScale: 0.9,
          expandOnClick: false,
          donut: {
            size: "70%",
          },
        },
      },
      series: data.series,
      states: {
        hover: {
          filter: {
            type: "none",
          },
        },
        active: {
          filter: {
            type: "none",
          },
        },
      },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        theme: "dark",
        custom: ({
          seriesIndex,
          w,
        }): string => `<div class='flex items-center h-8 min-h-8 max-h-8 px-3'>
                                                    <div class='w-3 h-3 rounded-full' style='background-color: ${w.config.colors[seriesIndex]};'></div>
                                                    <div class='ml-2 text-md leading-none'>${w.config.labels[seriesIndex]}:</div>
                                                    <div class='ml-2 text-md font-bold leading-none'>${w.config.series[seriesIndex]}%</div>
                                                </div>`,
      },
    };
  }

  getUserInfo(userId: number) {
    this.httpService.get("api/User/GetUsersById?userId=", userId).subscribe(
      (res: any) => {
        if (res.data && res.data.admin_account != 3) {
          res.data.admin_name = res.data.isadmin_account
            ? res.data.contactperson_name
            : res.data.full_name
            ? res.data.full_name
            : res.data.first_name;
        }
        this.accountInfo.next(res.data);
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }
  editPatient(data) {
    console.log(data)
    this.dialog
      .open(AddPatientComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "patient-reg-form",
        position: { right: "0" },
        data: { data },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.newGetPatientsInfo();
        }
      });
  }
  
  addIP(data) {
    this._matDialog
      .open(AddIpModalComponent, {
        width: "60rem",
        height: "100%",
        panelClass:"no-padding-popup",
        position: { right: "0" },
        data: {data, billingType:'IP'}, 
      })
      .afterClosed()
      .subscribe((dataObj) => {
        if (dataObj) {
           data.have_vitals = true;
         // this.getPatientVital();
        }
        // this.getPatientsInfo();
      });
  }

  deleteRecord(data) {
    console.log(data);
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Patient",
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
        const url =
          `api/Patient/DeletePatient?patientid=` +
          data.user_id +
          `&withrelation=` +
          data.isprimary_account;
        this.httpService.create(url, null).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.newGetPatientsInfo();
              this.getDashboardCount();
              this.snackBar.open("Patient deleted successfully. ", "close", {
                panelClass: "snackBarSuccess",
                duration: 2000,
              });
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  getAppointments(navType: string) {

    if((this.userInfo.admin_account != 3)){
      if(navType == '8'){ 
        this._router.navigate(["/apps/queue"]);
      }else if(navType == '10'){
        this._router.navigate(["/calr/calendar"]);
      }else if(navType == '13'){
        this._router.navigate(["/calr/calendar"]);
      }
    }else{
      this._router.navigate(["/apps/queue"], { state: { navType } });
    }
    
  }
  addTestModel(data) {
    console.log(data);
    this.dialog
      .open(LabTestsComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { patient: data, role: "Front Desk" },
      })
      .afterClosed()
      .subscribe((dataObj) => {
        console.log(dataObj);
        if (dataObj) {
          this.billingModel(data, dataObj);

          // this.getPatientVital();
        }
        this.newGetPatientsInfo();
      });
  }

  billingModel(data, id) {
    this.dialog
      .open(LabBillingComponent, {
        width: "60rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { data, labId: id, role: "Front Desk" },
      })
      .afterClosed()
      .subscribe((dataObj) => {
        if (dataObj) {
          data.have_vitals = true;
          // this.getPatientVital();
        }
        // this.newGetPatientsInfo();
      });
  }
  GetRequestedPatientsInfo() {
    console.log("hi");
    
    const url = `api/User/GetUserRequestedAppointments?pagesize=${this.pageSize}&pageno=${this.currentPage + 1}&fromdate=&todate=&searchtext=${this.filterVal}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          // this.isLoading=false;
          // this.testServiceList = res.data;
          // this.dataSource.data = res.data;
          // console.log(this.testServiceList);
          this.requestedPatients$.next(res.data.userdata);
          this.requestedTotalRecords$.next(res.data.totalrecords);
           console.log(this.requestedPatients$);
        }else{
          // this.isLoading=false;
          // this.testServiceList=[];
          // this.dataSource.data =[];
        }
      },
      (error: any) => {
        // this.isLoading=false;
        console.log("error", error);
      }
    ); 
  }
  bookRequestAppointment(appointmentdata?: any, ) {
    console.log(appointmentdata)
    this.dialog
      .open(AppointmentFormModalComponent, {  
        width: "50rem",
        height: "100%",
        panelClass:"no-padding-popup",
        position: { right: "0" },
        // appointmentdata.request_status 
         data: { patient: appointmentdata, page:appointmentdata.opinion_id? 'Enroll':appointmentdata.request_status},
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          //  this.getPatientSubscriptions();
        }
      });
  }
  deleteAppointment(data) {
    console.log(data)
    // const dialogRef = this._matDialog.open(ReasonForCancelComponent, {
    //   width: "450px",
    //   data: { patientData: data },
    // });

    // dialogRef.afterClosed().subscribe((result) => {
    //   this.GetRequestedPatientsInfo();
    //   console.log("The dialog was closed");
      
    // });
    const confirmation = this._fuseConfirmationService.open({
      title: "Cancel Appointment",
      message:
        "Are you sure you want to cancel this appointment? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Cancel",
        },
        cancel: {
          label: "Close",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
          // this.openDialog();
        const url = `api/Doctor/UpdateAppointmentStatus?appointmentid=${data.appointment_id}&statusid=${13}&actionby=${this.userInfo.user_id}&patientid=${data.user_id}`;
        this.httpService.create(url, null).subscribe((res: any) => {
            if (res?.isSuccess) {
              this.GetRequestedPatientsInfo();
              this.snackBar.open("Appointment canceled successfully. ","close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
              this.GetRequestedPatientsInfo();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }
}
