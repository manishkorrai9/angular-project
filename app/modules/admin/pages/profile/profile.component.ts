import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
} from "@angular/core";
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexMarkers,
  ApexPlotOptions,
  ApexYAxis,
  ApexTheme,
  ApexTitleSubtitle,
  ApexFill,
} from "ng-apexcharts";
import { trigger, transition, animate, style } from "@angular/animations";

import { ChiefComplaintModalComponent } from "../../apps/patient-prescription/chief-complaint-modal/chief-complaint-modal.component";
import { DiagnosisModalComponent } from "../../apps/patient-prescription/diagnosis-modal/diagnosis-modal.component";
import { ExaminationsComponent } from "../../apps/patient-prescription/examinations/examinations.component";
import { PresentIllnessComponent } from "../../apps/patient-prescription/present-illness/present-illness.component";
import { MedicationModalComponent } from "../../apps/patient-prescription/medication-modal/medication-modal.component";
import { MatDialog } from "@angular/material/dialog";
import { HistoriesComponent } from "../../apps/history-popups/histories.component";
import { AllergiesComponent } from "../../apps/allergy-popups/allergies.component";
import { RosComponent } from "../../apps/patient-prescription/ros/ros.component";
import { ActivatedRoute, Router } from "@angular/router";
import { APIService } from "app/core/api/api";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import moment from "moment";
import { FuseConfirmationService } from "@fuse/services/confirmation";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "app/core/auth/auth.service";
import { VideoCallComponent } from "../../apps/video-call/video-call.component";
import { ImmunisationModalComponent } from "../../apps/patient-prescription/immunisation-modal/immunisation-modal.component";
import { MatTableDataSource } from "@angular/material/table";
import { AddVitalModalComponent } from "./add-vital-modal/add-vital-modal.component";
import { environment } from "environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { NotificationsService } from "app/layout/common/notifications/notifications.service";
import { SelectionModel } from "@angular/cdk/collections";
import { FileManagerReportViewComponent } from "../../apps/file-manager/report-view/report-view.component";
import { AddVitalNotesComponent } from "./add-vital-notes/add-vital-notes.component";
import { WeightLogsComponent } from "./activity-analysis/weight-logs/weight-logs.component";
import { StepsLogsComponent } from "./activity-analysis/steps-logs/steps-logs.component";
import { WaterLogsComponent } from "./activity-analysis/water-logs/water-logs.component";
import { SleepLogsComponent } from "./activity-analysis/sleep-logs/sleep-logs.component";
import { MedicineLogsComponent } from "./activity-analysis/medicine-logs/medicine-logs.component";
import { SymptomsComponent } from "./symptoms/symptoms.component";
import { AddClinicalDataModalComponent } from "./add-clinical-data-modal/add-clinical-data-modal.component";

import { column } from "./circular-progress-chart/circular-progress-chart.component";
import { catchError } from "rxjs/operators";
import { forkJoin, of } from "rxjs";
import { TreatmentComponent } from "./treatment/treatment.component";
import { DailyNutritionDetailsComponent } from "./activity-analysis/daily-nutrition-details/daily-nutrition-details.component";
import { AssessmentResultsComponent } from "./assessment-results/assessment-results.component";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  theme: ApexTheme;
  yaxis: ApexYAxis;
  fill: ApexFill;
  title: ApexTitleSubtitle;
  plotOptions: ApexPlotOptions;
};

export type ChartBPOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  apexStroke: ApexStroke;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
};

@Component({
  selector: "profile",
  templateUrl: "./profile.component.html",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateX(100%)" }),
        animate("200ms ease-in", style({ transform: "translateX(0%)" })),
      ]),
      transition(":leave", [
        animate("200ms ease-in", style({ transform: "translateX(100%)" })),
      ]),
    ]),
  ],
})
export class ProfileComponent {
  /**
   * Constructor
   */

  loading: boolean = false;
  billLoading: boolean = false;
  isBilled: boolean = false;
  prescriptionStatus: any = {};
  isAppointmentRunning: boolean = false;
  @ViewChild("chart") chart: ChartComponent;
  @ViewChild("print") printBtn: ElementRef<HTMLElement>;
  @ViewChild("treatmentForm") treatmentForm: TreatmentComponent;
  public chartOptions: Partial<ChartOptions>;
  /* eslint-disable */
  subscriptionObj: any = {};

  displayedColumns: string[] = [
    "select",
    "created_on",
    "hospital_service",
    "quantity",
    "amount",
    "discount_amount",
    "paid_amount",
    "billed",
  ];
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel(true, []);

  public chartBPOptions: Partial<ChartBPOptions>;
  pageNumber: number = 1;
  reportsPageNumber = 1;
  reportsPageSize = 10;
  discountAmount: number = 0;
  finalAmount: number = 0;
  vitalsType: number = 6;
  visibility: boolean = false;
  id: any;
  userInfo: any;
  appointments: any;
  isEnableActiveAnalysis: boolean = true;
  isEnableClinicalAnalysis: boolean = true;
  isSetupCompleted: boolean = false;
  isEnableReportAnalysis: boolean = true;
  isEnablePayment: boolean = true;
  latestActivity: any = {};
  subTotalAmount: number = 0;
  billId: any;
  currentDate = new Date();
  billedServices: any[] = [];
  tabIndex: number = 0;
  patient$ = new BehaviorSubject<any>(null);
  patientVital$ = new BehaviorSubject<any>(null);
  allComplaints$ = new BehaviorSubject<any>(null);
  complaint: any;
  investigationReports: any;
  labReport$ = new BehaviorSubject<any>([]);
  radiologyReport$ = new BehaviorSubject<any>([]);
  investigationReport$ = new BehaviorSubject<any>([]);
  isPrescription = true;
  isLabReport = false;
  printTitle: string;
  videoCallCompleted: boolean = false;
  isInvestigation = false;
  monthNames: string[] = [];
  emptyChart: boolean = false;
  allPresentIllness$ = new BehaviorSubject<any>(null);
  allPatientDiagnosis$ = new BehaviorSubject<any>(null);
  allExaminations$ = new BehaviorSubject<any>(null);
  examin: any;
  wizardSteps: any;
  secondOpinionOverviewDetails: any;
  expert_opinion_status: string;

  appointmentId: number = 0;
  noIssuesId: number;
  host: string = "https://hellokidneydata.s3.ap-south-1.amazonaws.com/";
  backwardSlash: string = "/";
  isSmokingData: boolean = false;
  isAlcoholData: boolean = false;
  allMedicalHistories$ = new BehaviorSubject<any>(null);
  allFamilyHistories$ = new BehaviorSubject<any>(null);
  allSurgicalHistories$ = new BehaviorSubject<any>(null);
  allMenstrualHistories$ = new BehaviorSubject<any>(null);
  allSmokingHistories$ = new BehaviorSubject<any>(null);
  allAlcholHistories$ = new BehaviorSubject<any>(null);
  allFoodAllergies$ = new BehaviorSubject<any>(null);
  allDrugAllergies$ = new BehaviorSubject<any>(null);
  allEnvAllergies$ = new BehaviorSubject<any>(null);
  patientBPGraph$ = new BehaviorSubject<any>(null);
  patientHRGraph$ = new BehaviorSubject<any>(null);
  allMedications$ = new BehaviorSubject<any>(null);
  allRos$ = new BehaviorSubject<any>(null);
  allImmunisations$ = new BehaviorSubject<any>(null);
  appointments$ = new BehaviorSubject<any>([]);
  sessionLoading: boolean = false;
  public user: any = {};
  noMedicalHistory = false;
  toggleGroupType: number = 55;
  isPanelOpen: boolean = true;
  panelOpenState: boolean = true;
  presentIllnessOPen: boolean = false;
  servicesAmounts: any[] = [];
  bloodSugar: any;
  isSecondOpinionTab: boolean;
  opinion_id: number;
  followUp: any = {};
  photo: any;
  notes: any[] = [];
  bmi: number;
  latestWeight: any;
  scalename: any;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private httpService: APIService,
    public dialog: MatDialog,
    private auth: AuthService,
    private _fuseConfirmationService: FuseConfirmationService,
    private snackBar: MatSnackBar,
    private _router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private _matDialog: MatDialog,
    private _notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(this.auth.user);

    // if(history.state && history.state.isSecondOpinionTab){
    //   this.isSecondOpinionTab =history.state.isSecondOpinionTab;
    // }
    

    this._activatedRoute.queryParams.subscribe((params) => {
      this.id = params["id"];
      this.appointmentId = params["appointment"];
      
      this.opinion_id = params["opinion_id"];
      this.getMEasurementDetails();
      this.expert_opinion_status = params["status"];

      if (params["secondopionion"] == "true") {
        this.isSecondOpinionTab = true;
      } else {
        this.isSecondOpinionTab = false;
      }
      // this.isSecondOpinionTab = params["secondopionion"] ? params["secondopionion"] : false;
      if (this.id && this.appointmentId) {
        this.getPatientPrescriptionStatus();
        this.getVideoStatus();
      }
      this.getPatientExperOpinionRport(this.id, this.opinion_id);
      this.getPatientPayments();
    });

    this.monthNames = Array.from({ length: moment().daysInMonth() }, (x, i) =>
      moment().startOf("month").add(i, "days").format("DD")
    );
    this.glatestweight(this.id)
    this.getDoctorInfo();
    this.getPatientInfo();
    this.getPatientLatestFollowup();
    this.getPatientVital();
    this.getWizardSteps();
    this.getpatientBpGraphData();
    this.getAllComplaintByUserId();
    // this.GetAllPrescriptionReports();
    this.GetAllInvestigationReports();
    // this.GetAllPrescriptionReports();
    this.getHistoryOfPresentIllness();
    this.getPatientDiagnosis();
    this.GetAllPhysicalExaminations();
    this.getMedicalHistory();
    this.getFamilyHistory();
    this.getSurgicalHistory();
    this.getMenstrualHistory();
    this.getAlcholHistory();
    this.getSmokingHistory();
    this.getFoodAllergies();
    this.getDrugAllergies();
    this.getEnvAllergies();
    this.getMedications();
    this.getPatientRos();
    this.getBloodSugar();
    this.getPatientImmunisation();
    this.getPatientAppointments();
    this.getAllNotes();
    this.getSecondOpinionOverview();
    this.get_subsription_data();
    this.getActivityData();

    this._notificationsService.addSignalRDataListner("notifyClient", (data) => {
      if (data.category == "Appointment" && data.id == this.id) {
        this.pageNumber = 1;
        this.getPatientPrescriptionStatus();
        this.getPatientAppointments();
        this.getPatientVital();
      }
    });

    if (history.state && history.state.payment) {
      this.tabIndex = 2;
    }
  }

  get_subsription_data() {
    const url1 = `api/Patient/GetPatientLatest_OpinionPlan?patientid=${this.id}`;
    this.httpService.getAll(url1).subscribe(
      (res: any) => {
        if (res.isSuccess && res.data) {
          this.subscriptionObj = res.data;
          console.log(this.subscriptionObj);
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  getSecondOpinionOverview() {
    this.httpService
      .getAll(
        `api/PatientRegistration/GetPatient_SecondOpinion_Overview?patientid=${this.id}`
      )
      .subscribe(
        (res: any) => {
          if (res.data) {
            this.secondOpinionOverviewDetails = res.data.medical_info;
            if (
              this.secondOpinionOverviewDetails &&
              this.secondOpinionOverviewDetails.symptoms
            ) {
              this.secondOpinionOverviewDetails.symptoms =
                this.secondOpinionOverviewDetails.symptoms.replace(/,/g, ", ");
            }
            if (
              this.secondOpinionOverviewDetails &&
              this.secondOpinionOverviewDetails.risk_factors
            ) {
              this.secondOpinionOverviewDetails.risk_factors =
                this.secondOpinionOverviewDetails.risk_factors.replace(
                  /,/g,
                  ", "
                );
            }
          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }

  gotNewTabExpertOpinion() {
    const url = this._router.serializeUrl(
      this._router.createUrlTree([`/expert-opionion`], {
        queryParams: {
          id: this.id,
          opinion_id: this.opinion_id,
          status: this.expert_opinion_status,
        },
      })
    );

    window.open(url, "_blank");
  }

  open_clinical_data_modal(SoaData?: any) {
    this.dialog
      .open(AddClinicalDataModalComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          data: this.id,
          secondOpinionData: this.secondOpinionOverviewDetails,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getSecondOpinionOverview();
        }
      });
  }
  getActivityData() {
    let date = moment().format("YYYY-MM-DD");

    let yesterDay = moment().subtract(1, "days").format("YYYY-MM-DD");

    const obser1$ = this.httpService
      .getAll(
        `api/PatientRegistration/GetPatientWeightDetails?patientid=${this.id}&date=${date}`
      )
      .pipe(catchError((error) => of(error)));
    const obser2$ = this.httpService
      .getAll(
        `api/PatientRegistration/GetPatientStepsTrackingDetails_ByID?patientid=${this.id}&date=${date}`
      )
      .pipe(catchError((error) => of(error)));
    const obser3$ = this.httpService
      .getAll(
        `api/PatientRegistration/GetPatient_SleepPattern?patientid=${this.id}&date=${yesterDay}`
      )
      .pipe(catchError((error) => of(error)));
    const obser4$ = this.httpService
      .getAll(`api/Patient/GetPatientDrinkingWaterSetting?PatientId=${this.id}`)
      .pipe(catchError((error) => of(error)));

    const obser5$ = this.httpService
      .getAll(`api/Patient/GetPatientDrinkingWaterinfo?patientid=${this.id}`)
      .pipe(catchError((error) => of(error)));

    const obser6$ = this.httpService
      .getAll(
        `api/PatientRegistration/GetMicroMacroNutrients?patientid=${this.id}&trackon=${date}`
      )
      .pipe(catchError((error) => of(error)));

    const obser7$ = this.httpService
      .getAll(
        `api/Patient/GetPatientMedicineTracker_ByType?patientid=${this.id}&trackon=${date}`
      )
      .pipe(catchError((error) => of(error)));

    forkJoin([
      obser1$,
      obser2$,
      obser3$,
      obser4$,
      obser5$,
      obser6$,
      obser7$,
    ]).subscribe(
      ([weight, steps, sleep, waterSetting, water, nutrition, medicine]) => {
        this.latestActivity = {
          weight:
            weight.data && weight.data.length !== 0 ? weight.data[0].weight : 0,
          steps:
            steps.data && steps.data.length !== 0
              ? steps.data[0].steps_count
              : 0,
          sleep:
            sleep.data && sleep.data.length !== 0 ? steps.data[0].hours : 0,
          waterSetting:
            waterSetting.data && waterSetting.data.length !== 0
              ? waterSetting.data[0].measurement_id
              : 0,
          water:
            waterSetting.data &&
            waterSetting.data.length !== 0 &&
            water.data &&
            water.data.length !== 0
              ? Math.round(
                  water.data.reduce(
                    (total, next) => total + Number(next.consumed_quantity),
                    0
                  )
                )
              : 0,
          nutrition: nutrition.data,
          medicine: medicine.data,
        };

        if (nutrition.data) {
          this.chartData.push({
            Name: "Macro",
            Value: nutrition.data.macros_sum,
          });
          this.chartData.push({
            Name: "Micro",
            Value: nutrition.data.micros_sum,
          });

          this.allChartData.push({
            Name: "Macro",
            Value: nutrition.data.target_count_macro,
          });
          this.allChartData.push({
            Name: "Micro",
            Value: nutrition.data.target_count_micro,
          });
        }
      },

      (error: any) => {
        console.log(error);
        // this.loading = false;
      }
    );
  }

  getPatientLatestFollowup() {
    const url = `api/Doctor/GetPatientLatestFollowupdetails?patientid=${this.id}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.isSuccess && res.data && res.data.appointment_id) {
          this.followUp = res.data;
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  getWizardSteps() {
    const url = `api/Patient/GetPatient_Kidneywizard_status?patientid=${this.id}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.isSuccess && res.data) {
          this.wizardSteps = res.data;

          if (!history.state.hasOwnProperty("tabNavigation")) {
            if (
              this.isSecondOpinionTab &&
              res.data.length !== 0 &&
              res.data[0].primary_consultation_step
            ) {
              this.isEnableClinicalAnalysis = false;
              this.isSetupCompleted = true;
              this.tabIndex = 1;
            }
            if (
              !this.isSecondOpinionTab &&
              res.data.length !== 0 &&
              res.data[0].treatment_step
            ) {
              this.isEnableClinicalAnalysis = false;
              this.isSetupCompleted = true;
              this.tabIndex = 1;
            }
          } else {
            if (history.state.tabNavigation == -1) {
              this.isEnableClinicalAnalysis = false;
              this.isSetupCompleted = true;
              this.tabIndex = 1;
            } else {
              if (
                this.isSecondOpinionTab &&
                res.data.length !== 0 &&
                res.data[0].primary_consultation_step
              ) {
                this.isEnableClinicalAnalysis = false;
                this.isSetupCompleted = true;
              }
              if (
                !this.isSecondOpinionTab &&
                res.data.length !== 0 &&
                res.data[0].treatment_step
              ) {
                this.isEnableClinicalAnalysis = false;
                this.isSetupCompleted = true;
              }
            }
          }

          if (
            this.user.roleId != 80241 &&
            res.data[0] &&
            res.data[0].primary_consultation_step
          ) {
            // this.isEnableClinicalAnalysis = false;
            // this.tabIndex = 1;
          }
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }
  getAllNotes() {
    const payload = {
      pageSize: 100,
      pageNo: 1,
      patientid: parseInt(this.id),
    };
    const url = `api/Notes/GetUserNotes_byPagination`;
    this.httpService.create(url, payload).subscribe(
      (res: any) => {
        if (res.isSuccess && res.data) {
          // this.notes = res.data;
          if (res.data.notes_data) {
            this.notes = res.data.notes_data;
            this.cd.detectChanges();
          }
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  getPatientPayments() {
    this.httpService
      .getAll(
        `api/User/GetPatientServicePayments?appointmentid=0&patientid=${this.id}`
      )
      .subscribe(
        (res: any) => {
          if (res.data) {
            this.servicesAmounts = res.data ? res.data : [];

            if (this.servicesAmounts && this.servicesAmounts.length !== 0) {
              const product =
                this.servicesAmounts.find((item) => item.is_billed) || null;

              if (product) {
                this.isBilled = true;
              }
            }

            this.dataSource.data = this.servicesAmounts;
            //this.selection.select(...this.servicesAmounts)
          } else {
            this.servicesAmounts = [];
          }
          //  this.dataSource = new MatTableDataSource<scheduledList>(res.data);
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }

  getPatientPrescriptionStatus() {
    const url = `api/Doctor/GetPatientPrescriptionStatus?doctorid=${this.user.user_id}&patientid=${this.id}&appointmentid=${this.appointmentId}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        console.log(res);
        if (res.isSuccess && res.data) {
          console.log(res.data);

          this.prescriptionStatus = res.data;
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  getVideoStatus() {
    const url = `api/Doctor/GetVideocallStatus?doctorid=${this.user.user_id}&patientid=${this.id}&appointmentid=${this.appointmentId}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        console.log(res);
        if (res.isSuccess && res.data) {
          this.videoCallCompleted = true;
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }

  ngAfterContentInit() {}
  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  getGraphData(type: number) {
    this.loading = true;
    this.vitalsType = type;

    switch (type) {
      case 1:
        this.getpatientBpGraphData();
        break;
      case 2:
        this.getPatientHeartRateGraph("heartrate");
        break;
      case 3:
        this.getpatientTempGraphData();
        break;
      case 4:
        this.getpatientRespiratoryGraphData();
        break;
      case 5:
        this.getpatientSpo2GraphData();
        break;

      case 6:
        this.getpatientBloodSugarGraphData();
        break;

      default:
        this.getpatientBpGraphData();
    }
  }
  getCommonGraph(type, min, max) {
    this.loading = true;

    this.chartOptions = {
      series: [
        {
          name: "Heart Rate",
          data: [
            {
              x: "1",
              y: null,
            },
            {
              x: "2",
              y: 90,
            },
            {
              x: "3",
              y: 95,
            },
            {
              x: "4",
              y: null,
            },
            {
              x: "5",
              y: null,
            },
            {
              x: "6",
              y: null,
            },
            {
              x: "7",
              y: 100,
            },
            {
              x: "8",
              y: 98,
            },
            {
              x: "9",
              y: null,
            },
            {
              x: "10",
              y: null,
            },
            {
              x: "11",
              y: null,
            },
            {
              x: "12",
              y: null,
            },
            {
              x: "13",
              y: null,
            },
            {
              x: "14",
              y: null,
            },
            {
              x: "15",
              y: null,
            },
            {
              x: "16",
              y: null,
            },
            {
              x: "17",
              y: null,
            },
            {
              x: "18",
              y: null,
            },
            {
              x: "19",
              y: null,
            },
            {
              x: "20",
              y: 100,
            },
            {
              x: "21",
              y: 105,
            },
            {
              x: "22",
              y: 90,
            },
            {
              x: "23",
              y: null,
            },
            {
              x: "24",
              y: null,
            },
            {
              x: "25",
              y: null,
            },
            {
              x: "26",
              y: null,
            },
            {
              x: "27",
              y: null,
            },
            {
              x: "28",
              y: null,
            },
            {
              x: "29",
              y: null,
            },
            {
              x: "30",
              y: null,
            },
          ],
        },
      ],
      chart: {
        type: "area",
        height: 320,
        animations: {
          enabled: false,
        },
        zoom: {
          enabled: false,
        },
        toolbar: {
          tools: {
            download:
              '<img src="assets/images/download.png" class="ico-download" width="20">',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
      },
      fill: {
        opacity: 0.8,
        type: "pattern",
        pattern: {
          style: "horizontalLines",
          width: 5,
          height: 5,
          strokeWidth: 3,
        },
      },
      markers: {
        size: 5,
        hover: {
          size: 9,
        },
      },

      tooltip: {
        intersect: true,
        shared: false,
      },
      theme: {
        palette: "palette1",
      },
      yaxis: {
        min: min,
        max: max,
        tickAmount: 5,
      },
      xaxis: {
        min: 1,
        max: 31,
        tickAmount: 4,
      },
    };
    this.loading = false;
  }

  getBPGraph() {
    this.loading = true;

    this.chartBPOptions = {
      series: [
        {
          data: [
            {
              x: "1",
              y: [0, 0],
            },
            {
              x: "2",
              y: [140, 80],
            },
            {
              x: "3",
              y: [130, 90],
            },
            {
              x: "4",
              y: [150, 100],
            },
            {
              x: "5",
              y: [0, 0],
            },
            {
              x: "6",
              y: [0, 0],
            },
            {
              x: "7",
              y: [120, 100],
            },
            {
              x: "8",
              y: [140, 100],
            },
            {
              x: "9",
              y: [0, 0],
            },
            {
              x: "10",
              y: [0, 0],
            },
            {
              x: "11",
              y: [0, 0],
            },
            {
              x: "12",
              y: [0, 0],
            },
            {
              x: "13",
              y: [130, 80],
            },
            {
              x: "14",
              y: [0, 0],
            },
            {
              x: "15",
              y: [0, 0],
            },
            {
              x: "16",
              y: [0, 0],
            },
            {
              x: "17",
              y: [170, 100],
            },
            {
              x: "18",
              y: [0, 0],
            },
            {
              x: "19",
              y: [0, 0],
            },
            {
              x: "20",
              y: [150, 100],
            },
            {
              x: "21",
              y: [100, 90],
            },
            {
              x: "22",
              y: [120, 100],
            },
            {
              x: "23",
              y: [0, 0],
            },
            {
              x: "24",
              y: [0, 0],
            },
            {
              x: "25",
              y: [0, 0],
            },
            {
              x: "26",
              y: [0, 0],
            },
            {
              x: "27",
              y: [0, 0],
            },
            {
              x: "28",
              y: [0, 0],
            },
            {
              x: "29",
              y: [0, 0],
            },
            {
              x: "30",
              y: [0, 0],
            },
          ],
        },
      ],
      chart: {
        type: "rangeBar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
            orientation: "vertical",
          },
          horizontal: false,
          columnWidth: "10%",
        },
      },
      tooltip: {
        enabled: true,
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          return (
            '<div class="arrow_box">' +
            "<span>" +
            w.globals.seriesRangeStart[seriesIndex][dataPointIndex] +
            " / " +
            w.globals.series[seriesIndex][dataPointIndex] +
            "</span>" +
            "</div>"
          );
        },
      },

      dataLabels: {
        enabled: true,
        offsetY: 5,
        style: {
          colors: ["#000"],
        },
        formatter: function (val, opt) {
          return opt.w.globals.seriesRangeStart[opt.seriesIndex][
            opt.dataPointIndex
          ]
            ? opt.w.globals.seriesRangeStart[opt.seriesIndex][
                opt.dataPointIndex
              ] +
                " / " +
                opt.w.globals.series[opt.seriesIndex][opt.dataPointIndex]
            : "";
        },
      },

      xaxis: {
        min: 1,
        max: 31,
        tickAmount: 4,
      },
      yaxis: {
        min: 60,
        max: 250,
        tickAmount: 5,
      },
    };

    this.loading = false;
  }

  addVitals() {
    this.dialog
      .open(AddVitalModalComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          patId: this.id,
          doctorId: this.user.user_id,
          appointmentId: this.appointmentId,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getPatientVital();
          this.getpatientBpGraphData();
        }
      });
  }

  addChiefComplaints() {
    this.dialog
      .open(SymptomsComponent, {
        width: "50rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: {
          patId: this.id,
          doctorId: this.user.user_id,
          appointmentId: this.appointmentId,
          complaints: this.allComplaints$,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.panelOpenState = true;
          this.getAllComplaintByUserId();
        }
      });
  }

  updateChiefComplaints(complaint) {
    console.log(complaint);
    this.dialog
      .open(ChiefComplaintModalComponent, {
        width: "50rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id, complaint, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getAllComplaintByUserId();
        }
      });
  }

  addDiagnosisModel() {
    this.dialog
      .open(DiagnosisModalComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getPatientDiagnosis();
        }
      });
  }
  addMedication() {
    this.dialog
      .open(MedicationModalComponent, {
        maxWidth: "90vw",
        width: "90rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        console.log(data);
        if (data) {
          this.getMedications();
        }
        this.getMedications();
      });
  }
  updateMedication(medications) {
    this.dialog
      .open(MedicationModalComponent, {
        maxWidth: "90vw",
        width: "90rem",
        height: "100%",
        position: { right: "0" },
        data: {
          userId: this.id,
          medications,
          appointmentId: this.appointmentId,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getMedications();
        }
      });
  }

  addImmunisation() {
    this.dialog
      .open(ImmunisationModalComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "immunisation",
        position: { right: "0" },
        data: {
          userId: this.id,
          doctorId: this.user.user_id,
          appointmentId: this.appointmentId,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        console.log(data);
        if (data) {
          this.getPatientImmunisation();
        }
      });
  }

  updateImmunisation(immunisation) {
    this.dialog
      .open(ImmunisationModalComponent, {
        width: "50rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: {
          userId: this.id,
          doctorId: this.user.user_id,
          immunisation,
          appointmentId: this.appointmentId,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getPatientImmunisation();
        }
      });
  }

  deleteImmunisation(id: any) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Immunisation",
      message:
        "Are you sure you want to delete this immunisation? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/Doctor/DeleteVaccinationSchedule?id=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getPatientImmunisation();
              this.snackBar.open(
                "Immunisation deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  deleteMedication(id: any) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Medication",
      message:
        "Are you sure you want to delete this medication? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/Doctor/DeleteCurrentMedicationEntry?id=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            console.log(res);
            if (res?.isSuccess) {
              this.getMedications();
              this.snackBar.open("Medication deleted successfully. ", "close", {
                panelClass: "snackBarSuccess",
                duration: 2000,
              });
            }
            this.getMedications();
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }
  isDiagnosisData: boolean = false;
  getPatientDiagnosis() {
    const url = `api/Patient/GetPatientDiagnosis?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allPatientDiagnosis$.next(res.data);
          this.isDiagnosisData = true;
        } else {
          this.allPatientDiagnosis$.next([]);
          this.isDiagnosisData = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  updatePatientDiagnosis(data: any) {
    this.dialog
      .open(DiagnosisModalComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, data, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getPatientDiagnosis();
        }
      });
  }

  deletePatientDiagnosis(diagnosis: any) {
    // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Diagnosis",
      message: "Are you sure you want to remove? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/Patient/DeletePatientDiagnosis?DiagonsisId=${diagnosis?.diagonsis_id}`;
        this.httpService.create(url, {}).subscribe(
          (res: any) => {
            this.getPatientDiagnosis();
            this.snackBar.open("Diagnosis deleted successfully.", "close", {
              panelClass: "snackBarSuccess",
              duration: 2000,
            });
          },
          (error: any) => {
            this.snackBar.open(error, "close", {
              panelClass: "snackBarFailure",
              duration: 2000,
            });
          }
        );
      }
    });
  }

  addExaminationModel() {
    this.dialog
      .open(ExaminationsComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.GetAllPhysicalExaminations();
        }
      });
  }
  updateExaminationModel(examin) {
    this.dialog
      .open(ExaminationsComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, examin, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.GetAllPhysicalExaminations();
        }
      });
  }

  addPresentIllnessModel() {
    this.dialog
      .open(PresentIllnessComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getHistoryOfPresentIllness();
          this.presentIllnessOPen = true;
        }
      });
  }

  addHistoriesModel() {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          patient: this.patient$.value,
          noIssuesId: this.noIssuesId,
          appointmentId: this.appointmentId,
          menstrualHistory: this.allMenstrualHistories$.value,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getMedicalHistory();
          this.getAlcholHistory();
          this.getSmokingHistory();
          this.getSurgicalHistory();
          this.getMenstrualHistory();
          this.getFamilyHistory();
        }
      });
  }

  editMedicalHistory(medicalHistory: any) {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          medicalHistory,
          patient: this.patient$.value,
          index: 0,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getMedicalHistory();
        }
      });
  }

  deleteMedicalHistory(id: number) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Medical Hostory",
      message:
        "Are you sure you want to delete this complaint? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/PatientHistory/DeleteMedicalHistory?historyId=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getMedicalHistory();
              this.snackBar.open(
                "Medical history deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  editSurgicalHistory(surgicalHistory: any) {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          surgicalHistory,
          patient: this.patient$.value,
          index: 1,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getSurgicalHistory();
        }
      });
  }

  deleteSurgicalHistory(id: number) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Surgical Hostory",
      message:
        "Are you sure you want to delete this complaint? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/SocialAndSurgicalHistory/DeleteSurgicalHistory?historyId=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getSurgicalHistory();
              this.snackBar.open(
                "Surgical history deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  editFamilyHistory(familyHistory: any) {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          familyHistory,
          patient: this.patient$.value,
          index: 2,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getFamilyHistory();
        }
      });
  }

  deleteFamilyHistory(id: any) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Family History",
      message:
        "Are you sure you want to delete this complaint? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/PatientHistory/DeleteFamilyHistory?historyId=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getFamilyHistory();
              this.snackBar.open(
                "Family history deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  editSmokingHistory(smoking: any) {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          smoking,
          patient: this.patient$.value,
          index: 3,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getSmokingHistory();
          this.getAlcholHistory();
        }
      });
  }

  deleteSmokingHistory(id: number) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Smoking History",
      message:
        "Are you sure you want to delete this history? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/SocialAndSurgicalHistory/DeleteSmokingHistory?historyId=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res.data) {
              this.snackBar.open(
                "Smoking history deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
              this.getSmokingHistory();
              // this.getAlcholHistory();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  editAlcholHistory(alchol: any) {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          alchol,
          patient: this.patient$.value,
          index: 3,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getSmokingHistory();
          this.getAlcholHistory();
        }
      });
  }

  roundTo(num: number, places: number) {
    const factor = 10 ** places;
    return Math.round(num * factor) / factor;
  };

  measurementObj: any;
  getMEasurementDetails() {
    let height;
    const url =
      `api/PatientRegistration/GetPatientMeasurementDetails?userid=` + this.id;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.measurementObj = res.data;

          if (this.measurementObj && this.measurementObj.height && this.measurementObj.weight) {
            height = this.measurementObj?.height * 30.48; 
            this.bmi = this.roundTo((this.measurementObj?.weight / height / height) * 10000, 1);
          }
          
          
          // [weight (kg) / height (cm) / height (cm)] x 10,000
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  deleteAlcholHistory(id: any) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete alchol History",
      message:
        "Are you sure you want to delete this history? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/SocialAndSurgicalHistory/DeleteAlchohalHistory?historyId=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res.data) {
              // this.getSmokingHistory();

              this.snackBar.open(
                "Alchol history deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
              this.getAlcholHistory();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  editMenstrualHistory(menstrual: any) {
    this.dialog
      .open(HistoriesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          menstrual,
          patient: this.patient$.value,
          index: 4,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getMenstrualHistory();
        }
      });
  }

  deleteMenstralHistory(id: any) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Menstral History",
      message:
        "Are you sure you want to delete this history? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/SocialAndSurgicalHistory/DeleteMenstralHistory?historyId=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getMenstrualHistory();
              this.snackBar.open(
                "Menstral history deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  addAllergiesModel() {
    this.dialog
      .open(AllergiesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getFoodAllergies();
          this.getDrugAllergies();
          this.getEnvAllergies();
        }
      });
  }

  updateFoodAllergy(foodAllergy) {
    this.dialog
      .open(AllergiesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, foodAllergy, index: 0 },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getFoodAllergies();
          this.getDrugAllergies();
          this.getEnvAllergies();
        }
      });
  }
  updateDrugAllergy(drugAllergy) {
    this.dialog
      .open(AllergiesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, drugAllergy, index: 1 },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getFoodAllergies();
          this.getDrugAllergies();
          this.getEnvAllergies();
        }
      });
  }

  updateEnvAllergy(envAllergy) {
    this.dialog
      .open(AllergiesComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, envAllergy, index: 2 },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getFoodAllergies();
          this.getDrugAllergies();
          this.getEnvAllergies();
        }
      });
  }

  deleteFoodAllergyById(id: number) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Food Allergy",
      message:
        "Are you sure you want to delete this Food allergy? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/PatientRegistration/DeletePatientFoodAllergy?allergyid=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getFoodAllergies();
              this.getDrugAllergies();
              this.getEnvAllergies();
              this.snackBar.open(
                "Food allergy deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  deleteDrugAllergyById(id: number) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Drug Allergy",
      message:
        "Are you sure you want to delete this Drug allergy? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/PatientRegistration/DeletePatientDrugAllergy?allergyid=` + id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getFoodAllergies();
              this.getDrugAllergies();
              this.getEnvAllergies();
              this.snackBar.open(
                "Drug allergy deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  deleteEnvAllergyById(id: number) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Environmental Allergy",
      message:
        "Are you sure you want to delete this Environmental allergy? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/PatientRegistration/DeletePatientEnvironmentAllergy?allergyid=` +
          id;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getFoodAllergies();
              this.getDrugAllergies();
              this.getEnvAllergies();
              this.snackBar.open(
                "Environmental allergy deleted successfully. ",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  addRosModel() {
    this.dialog
      .open(RosComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getPatientRos();
        }
      });
  }
  isRosData: boolean = false;
  getPatientRos() {
    const url = `api/Patient/GetPatientROS?PatientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allRos$.next(res.data);
          this.isRosData = true;
        } else {
          this.allRos$.next([]);
          this.isRosData = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getPatientImmunisation() {
    const url = `api/Doctor/GetPatientVaccinationSchedule?PatientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allImmunisations$.next(res.data);
        } else {
          this.allImmunisations$.next([]);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  //i copied upto here

  getPatientAppointments() {
    const url = `api/Patient/GetPatientAllApointments?patientid=${this.id}&pagesize=10&pageno=${this.pageNumber}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          if (res.data && res.data.length !== 0) {
            if (
              res.data[0].status == "Start" ||
              res.data[0].status == "Running" ||
              res.data[0].status == "Pending"
            ) {
              this.isAppointmentRunning = true;
              this.appointments = res.data[0];
              this.appointmentId = this.appointments.calender_id;
            }
          }

          res.data.forEach(function (element) {
            let actual = moment(element.appointment_date).format("YYYY-MM-DD");
            let currentDate = moment().format("YYYY-MM-DD");

            if (moment(actual).isAfter(currentDate, "day")) {
              element.isGreaterDate = true;
            } else {
              element.isGreaterDate = false;
            }
          });

          if (this.pageNumber == 1) {
            this.appointments$.next(res.data);
          } else if (this.pageNumber > 1) {
            const currentValue = this.appointments$.value;
            const updatedValue = [...currentValue, ...res.data];
            console.log(updatedValue);
            this.appointments$.next(updatedValue);
          }
          this.pageNumber = this.pageNumber + 1;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  editPatientRos(data: any) {
    console.log(data);
    this.dialog
      .open(RosComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: {
          userId: this.id,
          patient: this.patient$.value,
          ros: data,
          appointmentId: this.appointmentId,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getPatientRos();
        }
      });
  }

  deletePatientRos(id: any) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete ROS",
      message:
        "Are you sure you want to delete this ROS? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/Patient/DeletePatientROS?PatientRosId=` + id;
        this.httpService.create(url, {}).subscribe(
          (res: any) => {
            if (res?.isSuccess) {
              this.getPatientRos();
              this.snackBar.open("Patient ROS deleted successfully.", "close", {
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

  getPatientInfo() {
    const url = `api/User/GetUsersById?userId=` + this.id;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.patient$.next(res.data);
        this.photo = `https://hellokidneydata.s3.ap-south-1.amazonaws.com/${res.data.photo_folderpath}/${res.data.photo_filename}`;
        this.printTitle = `${res.data.first_name}_bill_${moment(
          this.currentDate
        ).format("DD-MMM-YYYY")}`;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  getDoctorInfo() {
    const url = `api/User/GetUsersById?userId=` + this.user.user_id;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.userInfo = res.data;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getPatientVital() {
    const url = `api/PatientRegistration/GetPatientVitals?userid=` + this.id;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.patientVital$.next(res.data);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  getBloodSugar() {
    const url = `api/Patient/GetPatientBloodSugar_Avg_Day?PatientId=${this.id}&date=`;
    this.httpService.getAll(url).subscribe((res: any) => {
      if (res) {
        if (res.data) {
          this.bloodSugar = res.data.average.toFixed(2);
          this.getpatientBloodSugarGraphData();
        }
      }
    });
  }

  getComplaintById(complaintId) {
    const url =
      `api/PatientIllnessAndCompliants/GetCheifComplaintById?complaintId=` +
      complaintId;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.complaint = res.data;
        console.log(res.data);
        this.updateChiefComplaints(res.data);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  isCheifComplantData: boolean = false;
  getAllComplaintByUserId() {
    const url = `api/PatientIllnessAndCompliants/GetAllCheifComplaint?patientId=${this.id}&appointmentId=0`;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allComplaints$.next(res.data);
          this.isCheifComplantData = true;
        } else {
          this.allComplaints$.next([]);
          this.isCheifComplantData = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  deleteComplaintById(complaintId) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Service",
      message: "Are you sure you want to delete? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url =
          `api/PatientIllnessAndCompliants/DeletePatientChiefComplaint?complaintId=` +
          complaintId;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess && res.data) {
              this.snackBar.open(
                "Chief Complaints & HPI deleted successfully.",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
              this.getAllComplaintByUserId();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }
  isExaminationData: boolean = false;
  GetAllPhysicalExaminations() {
    const url = `api/Doctor/GetAllPhysicalExaminations?patientid=${this.id}&appointmentid=0`;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allExaminations$.next(res.data);
          this.isExaminationData = true;
        } else {
          this.allExaminations$.next([]);
          this.isExaminationData = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getPhysicalExaminationById(examinId) {
    const url = `api/Doctor/GetPhysicalExaminationById?id=` + examinId;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.examin = res.data;
        this.updateExaminationModel(res.data);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  GetAllInvestigationReports() {
    const url = `api/Investigations/GetAllPatientReportss?patientId=${this.id}&pagesize=${this.reportsPageSize}&pageno=${this.reportsPageNumber}&reporttypeid=${this.toggleGroupType}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.investigationReports = res.data.map(function (file: any) {
            if (file.listOfFiles && file.listOfFiles.length !== 0) {
              file.src = `https://hellokidneydata.s3.ap-south-1.amazonaws.com/${file.listOfFiles[0].folder_path}/${file.listOfFiles[0].file_name}`;
            }
            return file;
          });

          if (this.reportsPageNumber == 1) {
            this.labReport$.next(
              this.investigationReports.filter((f) => f.reporttype_id === 57)
            );
            this.investigationReport$.next(
              this.investigationReports.filter((f) => f.reporttype_id === 55)
            );
          } else {
            const prescriptionCurrent = this.investigationReport$.value;

            let prescription = this.investigationReports.filter(
              (f) => f.reporttype_id === 57
            );

            const updatedValue = [...prescriptionCurrent, prescription];

            let labReportCurrent = this.labReport$.value;

            let labReport = this.investigationReports.filter(
              (f) => f.reporttype_id === 57
            );

            const updatedValueLab = labReportCurrent.concat(labReport);

            this.labReport$.next(updatedValueLab);
            this.investigationReport$.next(updatedValue);
          }
        } else {
          if (this.reportsPageNumber == 1) {
            this.labReport$.next(null);
            this.investigationReport$.next(null);
          }
        }
        this.reportsPageNumber = this.reportsPageNumber + 1;
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  deleteExaminById(examinId) {
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Service",
      message:
        "Are you sure you want to delete this examination? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/Doctor/DeletePhysicalExamination?id=` + examinId;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess && res.data) {
              this.snackBar.open(
                "Examinations deleted successfully.",
                "close",
                {
                  panelClass: "snackBarSuccess",
                  duration: 2000,
                }
              );
              this.GetAllPhysicalExaminations();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  GetAllPrescriptionReports() {
    const url =
      `api/Prescription/GetAllPrescriptionReports?patientid=` + this.id;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.investigationReport$.next(res.data);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  downloadFile(report) {
    this._matDialog
      .open(FileManagerReportViewComponent, {
        width: "40rem",
        height: "100%",
        position: { right: "0" },
        data: { report },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }
  report(type) {
    this.reportsPageNumber = 1;
    if (type === 55) {
      this.isPrescription = true;
      this.isLabReport = false;
      this.isInvestigation = false;
      this.GetAllInvestigationReports();
    } else if (type === 57) {
      this.isPrescription = false;
      this.isLabReport = true;
      this.isInvestigation = false;
      this.GetAllInvestigationReports();
    } else if (type === "all") {
      this._router.navigateByUrl('/reports?id='+ this.id);
      // this.tabIndex = 2;
    }
  }

  getpatientBpGraphData() {
    const url = `api/PatientRegistration/GetPatientBPGraph?patientid=${this.id}&type=month`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.patientBPGraph$.next(res.data);
        if (res.data) {
          this.setBPGraph(res.data);
        } else {
          this.loading = false;
          this.emptyChart = true;
          this.emptyDataGraph(2, []);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  displayPrescription(patientid, appointment_id) {
    const url = `${environment.apiURL}api/Doctor/DownloadPatientPrescriptions?patientid=${patientid}&appointmentid=${appointment_id}`;
    const headers = new HttpHeaders().set(
      "Content-Type",
      "text/plain; charset=utf-8"
    );
    this.http
      .post(url, {}, { headers, responseType: "text" })
      .subscribe((data: any) => {
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          window.navigator.userAgent
        );

        const iframe = document.createElement("iframe");
        document.body.appendChild(iframe); // 👈 still required
        iframe.contentWindow.document.open();
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.opacity = "0.01";
        iframe.contentWindow.document.title = `${this.patient$.value.first_name?.trim()}-${moment(
          this.prescriptionStatus.appointment_date
        ).format("DD-MMM-YYYY")}.pdf`;

        iframe.contentWindow.document.write(data);

        var tempTitle = document.title;
        document.title = `${this.patient$.value.first_name?.trim()}-${moment(
          this.prescriptionStatus.appointment_date
        ).format("DD-MMM-YYYY")}.pdf`;

        try {
          iframe.contentWindow.document.execCommand("print", false, null);
        } catch (e) {
          iframe.contentWindow.print();
        }

        iframe.contentWindow.document.close();

        document.title = tempTitle;

        // html2canvas(iframe.contentWindow.document.body).then(canvas => {
        //   // Few necessary setting options

        //   const contentDataURL = canvas.toDataURL('image/png')
        //   let pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
        //   var width = pdf.internal.pageSize.getWidth();
        //   var height = canvas.height * width / canvas.width;
        //   pdf.addImage(contentDataURL, 'PNG', 0, 0, width, height)
        //   pdf.save(`${this.patient$.value.first_name?.trim()}-${moment(this.prescriptionStatus.appointment_date).format("DD-MMM-YYYY")}.pdf`); // Generated PDF

        //   });
      });
  }

  getPatientHeartRateGraph(vitType) {
    this.emptyChart = false;
    const url = `api/PatientRegistration/GetPatientHeartRateGraph?patientid=${this.id}&type=month`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.patientHRGraph$.next(res.data);
        if (res.data) {
          this.setHeartRateGraph(vitType, res.data);
        } else {
          this.loading = false;
          this.emptyChart = true;
          this.emptyDataGraph(2, []);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getpatientTempGraphData() {
    let type = 2;
    this.emptyChart = false;
    const url = `api/PatientRegistration/GetPatientTempGraph?patientid=${this.id}&type=month`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.patientHRGraph$.next(res.data);
      if (res.data) {
        this.loading = false;
        let data: any = [];

        if (type == 2) {
          this.monthNames.forEach((monthObj) => {
            let weekobj = this.setWeekdata(res.data, monthObj);
            if (weekobj.type_name) {
              data.push({
                x: weekobj.type_name,
                y: weekobj.temp_f ? weekobj.temp_f : null,
              });
            } else {
              data.push({
                x: monthObj,
                y: null,
              });
            }
          });
        } else {
          res.data.forEach((dataObj) => {
            if (dataObj.temp_f) {
              data.push({
                x: dataObj.type_name,
                y: dataObj.temp_f ? dataObj.temp_f : null,
              });
            }
          });
        }

        let series = [];
        series.push({
          name: "Temperature",
          data: data,
        });

        this.initiateTempGraph(series, type);
      } else {
        this.loading = false;
        this.emptyChart = true;
        this.emptyDataGraph(type, []);
      }
    });
  }

  getpatientBloodSugarGraphData() {
    let type = 2;
    this.emptyChart = false;
    let daySeries: any = [];

    const url = `api/Patient/GetPatientBloodSugarGraph_combined?patientid=${this.id}&type=month`;

    this.httpService.getAll(url).subscribe((res: any) => {
      this.patientHRGraph$.next(res.data);
      if (res.data) {
        // this.patientHRGraph.next(res.data);
        this.loading = false;
        let data: any = [];

        if (type == 2) {
          this.monthNames.forEach((monthObj) => {
            let weekobj = this.setWeekdata(res.data, monthObj);
            if (weekobj.type_name) {
              data.push({
                x: weekobj.type_name,
                y: weekobj.blood_sugar ? weekobj.blood_sugar : null,
              });
            } else {
              data.push({
                x: monthObj,
                y: null,
              });
            }
          });
        }

        let series = [];
        series.push({
          name: "Blood Sugar",
          data: data,
        });
        this.initiateTempGraph(series, 6);
      } else {
        this.loading = false;
        this.emptyChart = true;
        this.emptyDataGraph(type, []);
      }
    });
  }

  getpatientRespiratoryGraphData() {
    let type = 2;
    this.emptyChart = false;
    const url = `api/PatientRegistration/GetPatientRespiratoryGraph?patientid=${this.id}&type=month`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.patientHRGraph$.next(res.data);
      if (res.data) {
        this.loading = false;
        let data: any = [];

        if (type == 2) {
          this.monthNames.forEach((monthObj) => {
            let weekobj = this.setWeekdata(res.data, monthObj);
            if (weekobj.type_name) {
              data.push({
                x: weekobj.type_name,
                y: weekobj.bmp ? weekobj.bmp : null,
              });
            } else {
              data.push({
                x: monthObj,
                y: null,
              });
            }
          });
        } else {
          res.data.forEach((dataObj) => {
            if (dataObj.temp_f) {
              data.push({
                x: dataObj.type_name,
                y: dataObj.temp_f ? dataObj.temp_f : null,
              });
            }
          });
        }

        let series = [];
        series.push({
          name: "Respiratory Rate",
          data: data,
        });
        this.initiateTempGraph(series, type);
      } else {
        this.loading = false;
        this.emptyChart = true;
        this.emptyDataGraph(type, []);
      }
    });
  }

  getpatientSpo2GraphData() {
    let type = 2;
    this.emptyChart = false;
    const url = `api/PatientRegistration/GetPatientSpoGraph?patientid=${this.id}&type=month`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.patientHRGraph$.next(res.data);
      if (res.data) {
        this.loading = false;
        let data: any = [];

        if (type == 2) {
          this.monthNames.forEach((monthObj) => {
            let weekobj = this.setWeekdata(res.data, monthObj);
            if (weekobj.type_name) {
              data.push({
                x: weekobj.type_name,
                y: weekobj.value ? weekobj.value : null,
              });
            } else {
              data.push({
                x: monthObj,
                y: null,
              });
            }
          });
        } else {
          res.data.forEach((dataObj) => {
            if (dataObj.temp_f) {
              data.push({
                x: dataObj.type_name,
                y: dataObj.temp_f ? dataObj.temp_f : null,
              });
            }
          });
        }

        let series = [];
        series.push({
          name: "Blood Oxygen",
          data: data,
        });
        this.initiateTempGraph(series, type);
      } else {
        this.loading = false;
        this.emptyChart = true;
        this.emptyDataGraph(type, []);
      }
    });
  }

  setBPGraph(resData) {
    let data: any = [];
    this.monthNames.forEach((monthObj) => {
      let weekobj = this.setWeekdata(resData, monthObj);
      if (weekobj.type_name) {
        data.push({
          x: weekobj.type_name,
          y: [weekobj.systolic_mmhg, weekobj.dystolic_mmhg],
        });
      } else {
        data.push({
          x: monthObj,
          y: [0, 0],
        });
      }
    });
    let series = [];
    series.push({
      name: "Blood Pressure",
      data: data,
    });

    this.chartBPOptions = {
      series: series,
      chart: {
        type: "rangeBar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
            orientation: "vertical",
          },
          horizontal: false,
          columnWidth: "10%",
        },
      },
      tooltip: {
        enabled: true,
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          return (
            '<div class="arrow_box">' +
            "<span>" +
            w.globals.seriesRangeStart[seriesIndex][dataPointIndex] +
            " / " +
            w.globals.series[seriesIndex][dataPointIndex] +
            "</span>" +
            "</div>"
          );
        },
      },

      dataLabels: {
        enabled: true,
        offsetY: 5,
        style: {
          colors: ["#000"],
        },
        formatter: function (val, opt) {
          return opt.w.globals.seriesRangeStart[opt.seriesIndex][
            opt.dataPointIndex
          ]
            ? opt.w.globals.seriesRangeStart[opt.seriesIndex][
                opt.dataPointIndex
              ] +
                " / " +
                opt.w.globals.series[opt.seriesIndex][opt.dataPointIndex]
            : "";
        },
      },

      yaxis: {
        min: 60,
        max: 250,
        tickAmount: 7,
      },
    };
  }

  setHeartRateGraph(vitType, resData) {
    let data: any = [];
    this.monthNames.forEach((monthObj) => {
      let weekobj = this.setWeekdata(resData, monthObj);
      if (weekobj.type_name) {
        data.push({
          x: weekobj.type_name,
          y: weekobj.heart_rate ? weekobj.heart_rate : null,
        });
      } else {
        data.push({
          x: monthObj,
          y: null,
        });
      }
    });
    let series = [];
    series.push({
      name: "Heart Rate",
      data: data,
    });

    this.chartOptions = {
      series: series,
      chart: {
        type: "area",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
            orientation: "vertical",
          },
          horizontal: false,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ["#000"],
        },
        formatter: function (val, opt) {
          return val ? `${val}` : undefined;
        },
      },
      stroke: {
        curve: "straight",
      },
      fill: {
        opacity: 0.8,
        type: "pattern",
        pattern: {
          style: "horizontalLines",
          width: 5,
          height: 5,
          strokeWidth: 3,
        },
      },
      markers: {
        size: 5,
        hover: {
          size: 9,
        },
      },
      tooltip: {
        intersect: true,
        shared: false,
      },
      theme: {
        palette: "palette1",
      },
      yaxis: {
        min: 30,
        max: 150,
        tickAmount: 5,
      },
    };
  }

  setWeekdata(data: any, name: string): any {
    let obj = {};

    for (let i = 0; i < data.length; i++) {
      if (data[i].type_name.toLocaleLowerCase() == name.toLocaleLowerCase()) {
        obj = data[i];
        break;
      }
    }

    return obj;
  }

  emptyDataGraph(type: number, data: any[]) {
    if (type) {
      this.monthNames.forEach((monthObj) => {
        data?.push({
          x: monthObj,
          y: [0, 0],
        });
      });
    } else {
      data = [];
    }

    let series = [];
    series.push({
      name: "Blood Pressure",
      data: data,
    });
    if (this.vitalsType === 1) {
      this.initiateBPGraph(series);
    } else {
      this.initiateGraph(series);
    }
  }

  initiateBPGraph(series: any) {
    this.chartBPOptions = {
      series: series,
      chart: {
        type: "rangeBar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
            orientation: "vertical",
          },
          horizontal: false,
          columnWidth: "10%",
        },
      },
      tooltip: {
        enabled: true,
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          return (
            '<div class="arrow_box">' +
            "<span>" +
            w.globals.seriesRangeStart[seriesIndex][dataPointIndex] +
            " / " +
            w.globals.series[seriesIndex][dataPointIndex] +
            "</span>" +
            "</div>"
          );
        },
      },

      dataLabels: {
        enabled: true,
        offsetY: 5,
        style: {
          colors: ["#000"],
        },
        formatter: function (val, opt) {
          return opt.w.globals.seriesRangeStart[opt.seriesIndex][
            opt.dataPointIndex
          ]
            ? opt.w.globals.seriesRangeStart[opt.seriesIndex][
                opt.dataPointIndex
              ] +
                " / " +
                opt.w.globals.series[opt.seriesIndex][opt.dataPointIndex]
            : "";
        },
      },

      yaxis: {
        min: 60,
        max: 250,
        tickAmount: 7,
      },
    };
    this.chartBPOptions.xaxis = {
      min: 1,
      max: 31,
      tickAmount: 4,
    };
  }

  initiateGraph(series: any) {
    this.chartOptions = {
      series: series,
      chart: {
        type: "rangeBar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
            orientation: "vertical",
          },
          horizontal: false,
          columnWidth: "10%",
        },
      },
      tooltip: {
        enabled: true,
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          return (
            '<div class="arrow_box">' +
            "<span>" +
            w.globals.seriesRangeStart[seriesIndex][dataPointIndex] +
            " / " +
            w.globals.series[seriesIndex][dataPointIndex] +
            "</span>" +
            "</div>"
          );
        },
      },

      dataLabels: {
        enabled: true,
        offsetY: 5,
        style: {
          colors: ["#000"],
        },
        formatter: function (val, opt) {
          return opt.w.globals.seriesRangeStart[opt.seriesIndex][
            opt.dataPointIndex
          ]
            ? opt.w.globals.seriesRangeStart[opt.seriesIndex][
                opt.dataPointIndex
              ] +
                " / " +
                opt.w.globals.series[opt.seriesIndex][opt.dataPointIndex]
            : "";
        },
      },

      yaxis: {
        min: 60,
        max: 250,
        tickAmount: 7,
      },
    };
    this.chartOptions.xaxis = {
      min: 1,
      max: 31,
      tickAmount: 4,
    };
  }

  initiateTempGraph(series: any, type: number) {
    this.chartOptions = {
      series: series,
      chart: {
        type: "area",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "top",
            orientation: "vertical",
          },
          horizontal: false,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ["#000"],
        },
        formatter: function (val, opt) {
          return val ? `${val}` : undefined;
        },
      },
      stroke: {
        curve: "straight",
      },
      fill: {
        opacity: 0.8,
        type: "pattern",
        pattern: {
          style: "horizontalLines",
          width: 5,
          height: 5,
          strokeWidth: 3,
        },
      },
      markers: {
        size: 5,
        hover: {
          size: 9,
        },
      },

      tooltip: {
        intersect: true,
        shared: false,
      },
      theme: {
        palette: "palette1",
      },
      yaxis: {
        // min: type == 6 ? 50 : 80,
        // max: type == 6 ? 450 : 110,
        tickAmount: 5,
      },
    };

    if (type == 2) {
      this.chartOptions.xaxis = {
        min: 1,
        max: 31,
        tickAmount: 4,
      };
    } else {
      this.chartOptions.xaxis = {};
    }
  }
  isPresentIllnessData: boolean = false;
  getHistoryOfPresentIllness() {
    const url = `api/PatientIllnessAndCompliants/GetAllPresentIllness?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allPresentIllness$.next(res.data);
          this.isPresentIllnessData = true;
        } else {
          this.allPresentIllness$.next([]);
          this.isPresentIllnessData = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  updatePresentIllness(illness: any) {
    this.dialog
      .open(PresentIllnessComponent, {
        width: "50rem",
        height: "100%",
        panelClass: "no-padding-popup",
        position: { right: "0" },
        data: { userId: this.id, illness, appointmentId: this.appointmentId },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getHistoryOfPresentIllness();
        }
      });
  }

  deletePresentIllness(illness: any): void {
    // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete History of Present illness",
      message: "Are you sure you want to remove? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        const url = `api/PatientIllnessAndCompliants/DeletePatientPresentIllness?illnessId=${illness?.illness_id}`;
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            this.getHistoryOfPresentIllness();
            this.snackBar.open("Illness deleted successfully.", "close", {
              panelClass: "snackBarSuccess",
              duration: 2000,
            });
          },
          (error: any) => {
            this.snackBar.open(error, "close", {
              panelClass: "snackBarFailure",
              duration: 2000,
            });
          }
        );
      }
    });
  }

  getMedicalHistory() {
    this.noIssuesId = 0;
    const url = `api/PatientHistory/GetMedicalHistories?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.allMedicalHistories$.next(res.data);

        let obj =
          res.data && res.data.find((o) => o.history_name == "No Issues");

        if (obj) {
          this.noIssuesId = obj.medicalhistory_id;
        }

        if (res?.data?.length > 0) {
          this.noMedicalHistory = false;
        } else {
          this.noMedicalHistory = true;
        }
      },
      (error: any) => {
        this.noMedicalHistory = true;
        console.log("error", error);
      }
    );
  }

  getFamilyHistory() {
    const url = `api/PatientHistory/GetFamilyHistories?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.allFamilyHistories$.next(res.data);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getSurgicalHistory() {
    const url = `api/SocialAndSurgicalHistory/GetPatientSurgicalHistory?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.allSurgicalHistories$.next(res.data);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getMenstrualHistory() {
    const url = `api/SocialAndSurgicalHistory/GetPatientMenstralHistory?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.allMenstrualHistories$.next(res.data);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getSmokingHistory() {
    const url = `api/SocialAndSurgicalHistory/GetPatientSmokingHistory?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.isSmokingData = true;
          this.allSmokingHistories$.next(res.data);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  getAlcholHistory() {
    const url = `api/SocialAndSurgicalHistory/GetPatientAlchohalHistory?patientId=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.isAlcoholData = true;
          this.allAlcholHistories$.next(res.data);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  isFoodAllergy = false;
  getFoodAllergies() {
    const url = `api/PatientRegistration/GetPatientFoodAllergies?patientid=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.isFoodAllergy = true;
          this.allFoodAllergies$.next(res.data);
        } else {
          this.allFoodAllergies$.next([]);
          this.isFoodAllergy = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  isDrugAllergy = false;
  getDrugAllergies() {
    const url = `api/PatientRegistration/GetPatientDrugAllergies?patientid=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allDrugAllergies$.next(res.data);
          this.isDrugAllergy = true;
        } else {
          this.allDrugAllergies$.next([]);
          this.isDrugAllergy = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  isEnvironmentAllergy = false;
  getEnvAllergies() {
    const url = `api/PatientRegistration/GetPatientEnvironmentAllergies?patientid=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allEnvAllergies$.next(res.data);
          this.isEnvironmentAllergy = true;
        } else {
          this.allEnvAllergies$.next([]);
          this.isEnvironmentAllergy = false;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  isMedicationData: boolean = false;
  getMedications() {
    const url = `api/Doctor/GetAllCurrentMedications?patientid=${this.id}&appointmentid=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allMedications$.next(res.data);
          this.isMedicationData = true;
        } else {
          this.isMedicationData = false;
          this.allMedications$.next([]);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  goBack() {
    window.history.back();
  }

  startVideoCall(res: any) {
    this.dialog
      .open(VideoCallComponent, {
        maxWidth: "100vw",
        maxHeight: "100vh",
        height: "100%",
        width: "100%",
        panelClass: "full-screen-modal",
        data: {
          video: res,
          // patientid: data.patient_id,
          // doctorName: data?.doctor_name,
          // appType: data?.appointment_type,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }

  startSession() {
    if (this.appointmentId) {
      this.sessionLoading = true;
      const url = `api/Doctor/VideoIntegration?appointmentid=${this.appointmentId}&doctorid=${this.user.user_id}&patientid=${this.id}`;
      this.httpService.getAll(url).subscribe(
        (res: any) => {
          console.log(res);
          this._router.navigate(["/video"], { state: { videoSession: res } });
          this.sessionLoading = false;
        },
        (error: any) => {
          this.sessionLoading = false;
          console.log("error", error);
        }
      );
    }
  }
  editNewTabPrescription(){
   
      const url = `api/Doctor/UpdateAppointmentStatus?appointmentid=${
        this.appointmentId
      }&statusid=${9}&actionby=${this.user.user_id}&patientid=${this.id}`;
      this.httpService.create(url, null).subscribe(
        (res: any) => {
          if (res?.isSuccess) {
            // Converts the route into a string that can be used
            // with the window.open() function
            const url = this._router.serializeUrl(
              this._router.createUrlTree([`/calr/prescription`], {
                queryParams: { id: this.id, appointment: this.appointmentId },
              })
            );

            window.open(url, "_blank");
          }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    
  }
  gotNewTabPrescription() {
    if (
      this.prescriptionStatus.status == "Start" ||
      this.prescriptionStatus?.status === "Pending"
    ) {
      const url = `api/Doctor/UpdateAppointmentStatus?appointmentid=${
        this.appointmentId
      }&statusid=${9}&actionby=${this.user.user_id}&patientid=${this.id}`;
      this.httpService.create(url, null).subscribe(
        (res: any) => {
          if (res?.isSuccess) {
            // Converts the route into a string that can be used
            // with the window.open() function
            const url = this._router.serializeUrl(
              this._router.createUrlTree([`/calr/prescription`], {
                queryParams: { id: this.id, appointment: this.appointmentId },
              })
            );

            window.open(url, "_blank");
          }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    } else {
      // Converts the route into a string that can be used
      // with the window.open() function
      const url = this._router.serializeUrl(
        this._router.createUrlTree([`/calr/prescription`], {
          queryParams: { id: this.id, appointment: this.appointmentId },
        })
      );

      window.open(url, "_blank");
    }
  }

  editPrescription(patientId: number, appointmentId: number) {
    
      const url = `api/Doctor/UpdateAppointmentStatus?appointmentid=${appointmentId}&statusid=${9}&actionby=${
        this.user.user_id
      }&patientid=${patientId}`;
      this.httpService.create(url, null).subscribe(
        (res: any) => {
          if (res?.isSuccess) {
            // Converts the route into a string that can be used
            // with the window.open() function
            const url = this._router.serializeUrl(
              this._router.createUrlTree([`/calr/prescription`], {
                queryParams: { id: patientId, appointment: appointmentId },
              })
            );

            window.open(url, "_blank");
          }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    
  }

  gotoPrescription(patientId: number, appointmentId: number) {
    if (
      this.prescriptionStatus.status == "Start" ||
      this.prescriptionStatus?.status === "Pending"
    ) {
      const url = `api/Doctor/UpdateAppointmentStatus?appointmentid=${appointmentId}&statusid=${9}&actionby=${
        this.user.user_id
      }&patientid=${patientId}`;
      this.httpService.create(url, null).subscribe(
        (res: any) => {
          if (res?.isSuccess) {
            // Converts the route into a string that can be used
            // with the window.open() function
            const url = this._router.serializeUrl(
              this._router.createUrlTree([`/calr/prescription`], {
                queryParams: { id: patientId, appointment: appointmentId },
              })
            );

            window.open(url, "_blank");
          }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    } else {
      // Converts the route into a string that can be used
      // with the window.open() function
      const url = this._router.serializeUrl(
        this._router.createUrlTree([`/calr/prescription`], {
          queryParams: { id: patientId, appointment: appointmentId },
        })
      );

      window.open(url, "_blank");
    }
  }

  onScrollDown(ev: any) {
    this.getPatientAppointments();
  }

  onScrollDownReports(ev: any) {
    this.GetAllInvestigationReports();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    console.log(this.isBilled);
    if (this.isBilled) {
      if (this.isAllSelected()) {
        this.selection.clear();
        return;
      }

      this.selection.select(...this.dataSource.data);
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!this.isBilled) {
      if (!row) {
        return `${this.isAllSelected() ? "deselect" : "select"} all`;
      }
      return `${this.selection.isSelected(row) ? "deselect" : "select"} row ${
        row.position + 1
      }`;
    }
  }

  generateBill() {
    this.billLoading = true;
    const selectedIds = this.selection.selected.map(
      ({ payment_id }) => payment_id
    );

    this.subTotalAmount = this.selection.selected.reduce(function (prev, cur) {
      return prev + cur.quantity * cur.amount;
    }, 0);

    let actualAmount = this.selection.selected.reduce(function (prev, cur) {
      return prev + cur.paid_amount;
    }, 0);

    if (actualAmount == this.subTotalAmount) {
      this.discountAmount = 0;
      this.finalAmount = this.subTotalAmount;
    } else {
      let discountPerc = (
        ((this.subTotalAmount - actualAmount) / this.subTotalAmount) *
        100
      ).toFixed(2);
      this.discountAmount = this.subTotalAmount - actualAmount;
      this.finalAmount = this.subTotalAmount - this.discountAmount;
    }

    const url = `api/User/BilledServices`;
    this.httpService.create(url, selectedIds).subscribe(
      (res: any) => {
        if (res.data) {
          this.billId = res.data;
          setTimeout(() => {
            let el: HTMLElement = this.printBtn.nativeElement;
            el.click();
            this.getPatientPayments();
            this.selection.clear();
            this.billLoading = false;
          }, 2000);
          this.cd.detectChanges();
        } else {
          console.warn("error in billed service");
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );

    // this.visibility = true;
    // setTimeout(() => {
    //   this.visibility = false;
    // }, 1000);
  }

  getBilledServices(billId: number) {
    const url = `api/User/GetPatientServicePaymentByBill?billno=${billId}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.billedServices = res.data ? res.data : [];
        } else {
          console.warn("error in service bills");
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  chartColors: string[] = ["#FF8A49", "#397EF5"];
  chartData: column[] = [];

  allChartData: column[] = [];

  title: string = "Today Nutrition Logs";

  addActivityInformation() {
    this.dialog
      .open(AddVitalNotesComponent, {
        width: "50rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: {
          patientId: this.id,
          doctorId: this.user.user_id,
          opinionId: this.opinion_id,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.getAllNotes();
        }
      });
  }

  weightLogs() {
    this.dialog
      .open(WeightLogsComponent, {
        width: "80rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }
  walkingLogs() {
    this.dialog
      .open(StepsLogsComponent, {
        width: "80rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }

  waterLogs() {
    this.dialog
      .open(WaterLogsComponent, {
        width: "80rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }
  sleepLogs() {
    this.dialog
      .open(SleepLogsComponent, {
        width: "80rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }

  medicineLogs() {
    this.dialog
      .open(MedicineLogsComponent, {
        width: "50rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }

  public doSomething(changed: any): void {
    if (changed) {
      this.isEnableClinicalAnalysis = true;
      this.isSetupCompleted = true;
      this.tabIndex = 1;
      this.cd.detectChanges();
    }
  }
  aboutPatient: any;
  recommendations: any;
  patient_references: any;
  getPatientExperOpinionRport(patId, OpinionId) {
    const url = `api/PatientRegistration/GetExpertOpinion?patientid=${patId}&opinionid=${OpinionId}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.isSuccess && res.data) {
          this.aboutPatient = res.data.about_patient;
          this.recommendations = res.data.recommendations;
          this.patient_references = res.data.patient_references;
        }
      },
      (error: any) => {
        console.warn("error", error);
      }
    );
  }
  saveTreatment() {
    console.log(this.treatmentForm.treatmentForm.value);
    let treatmentForm = this.treatmentForm.treatmentForm.value;

    let payload = {
      preference_id: 0,
      patient_id: parseInt(this.id),
      patient_daily_activity: undefined,
      symptoms_activation: treatmentForm.symptomActivity
        ? treatmentForm.symptomActivity
        : undefined,
      education_category: undefined,
      nutrician_followup: treatmentForm.preferences.nutritionFollowUp
        ? treatmentForm.preferences.nutritionFollowUp
        : undefined,
      nutrician_followup_timings: treatmentForm.preferences
        .nutritionFollowUpTimings
        ? treatmentForm.preferences.nutritionFollowUpTimings
        : undefined,
      followup_lang_preferences: treatmentForm.preferences.language
        ? treatmentForm.preferences.language
        : undefined,

      created_by: this.user.user_id,
      no_of_consultations: treatmentForm.doctorConsultation
        ? parseInt(treatmentForm.doctorConsultation)
        : undefined,
      diagnostic_report: treatmentForm.diagnosticReportPlan
        ? treatmentForm.diagnosticReportPlan
        : undefined,
      is_bloodsugar: treatmentForm.vitals.bloodSugar
        ? treatmentForm.vitals.bloodSugar
        : undefined,
      bloodsugar_options: treatmentForm.vitals.bloodSugarOptions
        ? treatmentForm.vitals.bloodSugarOptions
        : undefined,
      is_bloodpressure: treatmentForm.vitals.bloodPressure
        ? treatmentForm.vitals.bloodPressure
        : undefined,
      bloodpressure_options: treatmentForm.vitals.bloodPressureOptions
        ? treatmentForm.vitals.bloodPressureOptions
        : undefined,
      is_temp: treatmentForm.vitals.temperature
        ? treatmentForm.vitals.temperature
        : undefined,
      temp_options: treatmentForm.vitals.temperatureOptions
        ? treatmentForm.vitals.temperatureOptions
        : undefined,
      is_spo2: treatmentForm.vitals.spo2
        ? treatmentForm.vitals.spo2
        : undefined,
      spo2_options: treatmentForm.vitals.spo2Options
        ? treatmentForm.vitals.spo2Options
        : undefined,
      is_heartrate: treatmentForm.vitals.heartRate
        ? treatmentForm.vitals.heartRate
        : undefined,
      heartrate_options: treatmentForm.vitals.heartRateOptions
        ? treatmentForm.vitals.heartRateOptions
        : undefined,
      is_respiratory: treatmentForm.vitals.respirateRate
        ? treatmentForm.vitals.respirateRate
        : undefined,
      respiratory_options: treatmentForm.vitals.respirateRateOptions
        ? treatmentForm.vitals.respirateRateOptions
        : undefined,
      is_weight: treatmentForm.vitals.weight
        ? treatmentForm.vitals.weight
        : undefined,
      weight_options: treatmentForm.vitals.weightOptions
        ? treatmentForm.vitals.weightOptions
        : undefined,
      is_water: treatmentForm.activities.water
        ? treatmentForm.activities.water
        : undefined,
      daily_water: treatmentForm.activities.dailyWater
        ? treatmentForm.activities.dailyWater
        : undefined,
      is_sleep: treatmentForm.activities.sleep
        ? treatmentForm.activities.sleep
        : undefined,
      sleep_routine: treatmentForm.activities.sleepOptions
        ? treatmentForm.activities.sleepOptions
        : undefined,
      is_steps: treatmentForm.activities.activity
        ? treatmentForm.activities.activity
        : undefined,
      steps_count: treatmentForm.activities.activityOptions
        ? treatmentForm.activities.activityOptions
        : undefined,
      is_medicine: treatmentForm.activities.medicine
        ? treatmentForm.activities.medicine
        : undefined,
      dietplan_recommendation: treatmentForm.nutritionLogs.dietPlan
        ? treatmentForm.nutritionLogs.dietPlan
        : undefined,
      daily_micros: treatmentForm.nutritionLogs.dailyMicros
        ? treatmentForm.nutritionLogs.dailyMicros
        : undefined,
      daily_macros: treatmentForm.nutritionLogs.dailyMacros
        ? treatmentForm.nutritionLogs.dailyMacros
        : undefined,
    };
    const url = "api/Patient/SavePatientActivityPreferences_setup";
    this.httpService.create(url, payload).subscribe(
      (res: any) => {
        this.snackBar.open("Treatment plan saved successufully. ", "close", {
          panelClass: "snackBarSuccess",
          duration: 2000,
        });
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  openDialyModal() {
    this.dialog
      .open(DailyNutritionDetailsComponent, {
        width: "75rem",
        panelClass: "no-padding-popup",
        height: "100%",
        position: { right: "0" },
        data: { userId: this.id },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      });
  }

  questionStatus:any = {};
  getCompletedAssemment() {
    const url = `api/Patient/GetPatientAssessment_IsTrueOrFalse?patientid=${this.id}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.questionStatus = res.data;
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  viewReports(status:boolean, type:string) {
    if(status) {
      this.dialog
      .open(AssessmentResultsComponent, {
        width: "50rem",
        height: "100%",
        panelClass:"no-padding-popup",
        position: { right: "0" },
         data: { patientId:this.id, type}
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
        }
      })
    }
  }
  nutritionQuestion:boolean = false;
  nutritionAssessment:boolean = false;
  habitQuestion:boolean = false;
  sendPatient(type:string) {

    const url = `api/Patient/SavePatientQuestionarySettings`;

    const obj = {
      "q_setting_id": 0,
      "patient_id": parseInt(this.id),
      "question_type": type,
      "is_enabled": true,
      "created_by": parseInt(this.user.user_id)
    }
    this.httpService.create(url, obj).subscribe(
      (res: any) => {

        if (type == 'Nutrition') {
          this.nutritionQuestion = true;
        } else if(type == 'NutritionAssessment') {
          this.nutritionAssessment = true;
        } else if(type == 'PatientHabits')  {
          this.habitQuestion = true;
        }
        this.cd.detectChanges();
      },
      (error: any) => {

      }
    );

  }
  glatestweight(pid) {
    const url = `api/PatientRegistration/GetPatientWeightDetails?patientid=${pid}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.latestWeight = res.data[0].weight;
          this.scalename=res.data[0].weight_scalename;
        } else {
          console.warn("error in service bills");
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
}
