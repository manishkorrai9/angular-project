import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FileManagerService } from 'app/modules/admin/apps/file-manager/file-manager.service';
import { Item, Items } from 'app/modules/admin/apps/file-manager/file-manager.types';
import { APIService } from 'app/core/api/api';

import { MatDialog } from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AuthService } from 'app/core/auth/auth.service';
import { ReportUploadComponent } from 'app/modules/admin/apps/file-manager/report-upload/report-upload.component';
import { FileManagerReportViewComponent } from 'app/modules/admin/apps/file-manager/report-view/report-view.component';


export type PatientData = {
    patientid: number,
    details: string
}

@Component({
  selector: 'app-report-analysis',
  templateUrl: './report-analysis.component.html',
  styleUrls: ['./report-analysis.component.scss'],
  encapsulation  : ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAnalysisComponent implements OnInit {
  @Input() patientReportId: any;
  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;
  drawerMode: 'side' | 'over';
  selectedItem: Item;
  items: Items;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  //searchControl = new FormControl();
  //searchPatients: string[] = [];
  filteredOptions$  = new BehaviorSubject<PatientData[]>(null);
  patientData : PatientData;
  selectedPatient$ = new BehaviorSubject<string>(null);
  selectedPatientId : string;
  patientReport$ = new BehaviorSubject<any>(null);
  investigationReports: any;
  labReport$ = new BehaviorSubject<any>([]);
  radiologyReport$ = new BehaviorSubject<any>(null);
  investigationReport$ = new BehaviorSubject<any>([]);
  isPrescription = false;
  isLabReport = true;
  isInvestigation = false;
  id: string;
  host:string = 'https://hellokidneydata.s3.ap-south-1.amazonaws.com/';
  backwardSlash:string = '/'
  patient: any; 
  pageSize=5;
  pageNumber=1;
  userInfo: any;
  toggleGroupType:number = 57;
  constructor(
      private route: ActivatedRoute,
      private _changeDetectorRef: ChangeDetectorRef,
      private _router: Router,
      private _fileManagerService: FileManagerService,
      private _fuseMediaWatcherService: FuseMediaWatcherService,
      private httpService: APIService,
      private _matDialog: MatDialog,
      private auth: AuthService, 
      private _fuseConfirmationService: FuseConfirmationService,
  ) {}

  ngOnInit(): void
  {
    this.id = this.route.snapshot.queryParamMap.get("id");
    // this._activatedRoute.queryParams.subscribe((params) => {
    //   this.id = params["id"];
    // });

    this.userInfo = JSON.parse(this.auth.user);
    console.log( this.id);

    if(this.id) {
      this.selectedPatientId = this.id;
      this.selectedPatId = this.id;
      this.getPatientInfo();
      this.onSelectionChange(null, this.id);
    }else  {
      this.selectedPatientId = localStorage.getItem('selectedPatientId');
      if(this.selectedPatientId) {
        this.getPatientInfo();
        this.onSelectionChange(null, this.selectedPatientId);
      }

    }
      // Get the items
      this._fileManagerService.items$
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((items: Items) => {
              this.items = items;

              // Mark for check
              this._changeDetectorRef.markForCheck();
          });

      // Get the item
      // this._fileManagerService.item$
      //     .pipe(takeUntil(this._unsubscribeAll))
      //     .subscribe((item: Item) => {
      //         this.selectedItem = item;

      //         // Mark for check
      //         this._changeDetectorRef.markForCheck();
      //     });

      // Subscribe to media query change
      this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((state) => {

              // Calculate the drawer mode
              this.drawerMode = state.matches ? 'side' : 'over';

              // Mark for check
              this._changeDetectorRef.markForCheck();
          });
  }

  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  onBackdropClicked(): void
  {
      // Go back to the list
      this._router.navigate(['./'], {relativeTo: this.route});

      // Mark for check
      this._changeDetectorRef.markForCheck();
  }

  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: any): any
  {
      return item.id || index;
  }
  disableUpload:boolean=false;
  tempArray:any;
  searchpatients(value) {
      const url = `api/Doctor/SearchPatients?searchText=${value}&userid=${this.userInfo.user_id}`;
      this.httpService.getAll(url).subscribe(
        (res: any) => {
            if(res.data && res.data.length > 0){
              this.filteredOptions$.next(res.data);
            }
            else {
              this.filteredOptions$.next([]);
              this.patientData = {
                  patientid : 0,
                  details : ''
              }
              this.selectedPatient$.next('');
              this.disableUpload=true;
            }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
    }
    selectedPatId:any;
    onSelectionChange(event, value) {
      
      this.pageNumber=1;

      if(event !== null && event?.option?.value !== undefined) {
        this.selectedPatient$.next(event.option.value);
        this.disableUpload=true;
        this.selectedPatientId=event?.option.id;
      }
      this.selectedPatientId = event?.option?.id !== undefined ? event?.option?.id : value;
      this.GetPatientReportsCount(this.selectedPatientId);
      this.GetAllInvestigationReports(null, this.selectedPatientId);
     // this.GetAllPrescriptionReports(this.selectedPatientId);
      if (this.toggleGroupType == 57) {
        this.isPrescription = false;
        this.isLabReport = true;
        this.isInvestigation = false;
      } else if(this.toggleGroupType == 55){
        this.isPrescription = true;
        this.isLabReport = false;
        this.isInvestigation = false;
      }
     
      if(this.selectedPatientId) {
        localStorage.setItem('selectedPatientId', this.selectedPatientId);
      }
    }
    clearReports() {
      this.disableUpload=true;
      this.selectedPatientId = undefined;
      this.selectedPatient$.next(null);
      this.patientReport$.next(null);
      this.investigationReport$.next([]);
      this.labReport$.next([]);
      this.radiologyReport$.next(null);
      localStorage.removeItem('selectedPatientId');
    }
    onSearchTerm(event) {
     
  
      if(event.target.value){
        this.searchpatients(event.target.value);
        this.disableUpload=false
      }else{
        this.disableUpload=true;
      }
         
    }

  GetPatientReportsCount(selectedPatientId) {
      const url = `api/Doctor/GetPatientReportsCount?patientid=${selectedPatientId}`;
      this.httpService.getAll(url).subscribe(
        (res: any) => {
            if(res.data){
              this.patientReport$.next(res.data);
            }
        },
        (error: any) => {
          console.log("error", error);
        }
      );
  }

  GetAllInvestigationReports(event:any, selectedPatientId:any) {
    const url =`api/Investigations/GetAllPatientReportss?patientId=${selectedPatientId}&pagesize=${this.pageSize}&pageno=${this.pageNumber}&reporttypeid=${this.toggleGroupType}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.investigationReports =  res.data.map(function(file:any){
            
            if (file.listOfFiles && file.listOfFiles.length !== 0) {
              file.src = `https://hellokidneydata.s3.ap-south-1.amazonaws.com/${file.listOfFiles[0].folder_path}/${file.listOfFiles[0].file_name}`;
            }
            return file;
          });;

          if (this.pageNumber == 1) {
            
            this.labReport$.next(
              this.investigationReports.filter((f) => f.reporttype_id === 57)
            );
            this.investigationReport$.next(
              this.investigationReports.filter((f) => f.reporttype_id === 55)
            );
          } else{
            
            const prescriptionCurrent = this.investigationReport$.value;

            let prescription = this.investigationReports.filter((f) => f.reporttype_id === 57)

            const updatedValue = [...prescriptionCurrent, prescription];


            let labReportCurrent = this.labReport$.value;

            let labReport = this.investigationReports.filter((f) => f.reporttype_id === 57)

            const updatedValueLab = labReportCurrent.concat(labReport);

            this.labReport$.next(updatedValueLab);
            this.investigationReport$.next(
              updatedValue
            );

          }
        
        } else {
          if (this.pageNumber == 1) {
            this.labReport$.next([]);
            this.investigationReport$.next([]);
          }
          
        }
          this.pageNumber = this.pageNumber+1;

      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  GetAllPrescriptionReports(selectedPatientId) {
    const url =`api/Prescription/GetAllPrescriptionReports?patientid=` + selectedPatientId;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.investigationReport$.next(res.data);
        } else {
          this.investigationReport$.next([]);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  GetLabpreports() {
    this.isPrescription = false;
    this.isLabReport = true;
    this.isInvestigation = false;
    this.onSelectionChange(null, this.selectedPatientId);
  }
  GetRadiologypreports() {
    this.isPrescription = false;
    this.isLabReport = false;
    this.isInvestigation = true;
    this.onSelectionChange(null, this.selectedPatientId);
  }
  GetPrescriptionpreports() {
    this.isPrescription = true;
    this.isLabReport = false;
    this.isInvestigation = false;
    this.onSelectionChange(null, this.selectedPatientId);

    //this.GetAllPrescriptionReports(this.selectedPatientId);
  }

  downloadFile(report) {
    console.log(report);
    this._matDialog
        .open(FileManagerReportViewComponent, { 
          width: "40rem",
          height: "100%",
          panelClass: "no-padding-popup",
          position: { right: "0" },
          data: { patientid: this.selectedPatientId, report},
        })
        .afterClosed()
        .subscribe((data) => {
          if (data) {
            this.getPatientInfo();
            this.getvalues();
          }
        });

    // window.open(
    //   "https://hellokidneydata.s3.ap-south-1.amazonaws.com/" + path + "/" + fileName
    // );
  }

  onScrollDown(ev: any) {
    this.GetAllInvestigationReports(ev, this.selectedPatientId);
  }

  getPatientInfo() {
    const url = `api/User/GetUsersById?userId=` + this.selectedPatientId;

    this.httpService.getAll(url).subscribe(
      (res: any) => {
        this.patient = res.data;
        this.selectedPatient$.next(this.patient?.first_name + ' ' + this.patient?.last_name + ' - ' + this.patient?.age+'yrs'+ ' - ' +this.patient?.gender + ' - ' +this.patient?.mobile_no);
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  deleteInvestigationReport(report: any) {
    const url = `api/Investigations/DeleteInvestigationRecord?id=` + report.id;
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Report?",
      message:
        "Are you sure you want to delete this report? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        this.httpService.create(url, null).subscribe(
          (res: any) => {
            if (res?.isSuccess && res.data) {
              this.GetPatientReportsCount(this.selectedPatientId);
              this.GetAllInvestigationReports(null, this.selectedPatientId);
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });
  }

  openUpload() {
    this._matDialog
        .open(ReportUploadComponent, { 
          width: "25rem",
          height: "100%",
          panelClass: "no-padding-popup",
          position: { right: "0" },
          data: { patientid: this.selectedPatientId},
        })
        .afterClosed()
        .subscribe((data) => {
          if (data) {
            this.getPatientInfo();
            this.getvalues();
          }
        });
  }
  getvalues() {
    this.onSelectionChange(null, this.selectedPatientId);
  }

  deletePrescriptionReport(report:any) {

    const url = `api/Prescription/DeletePrescription?prescriptionid=${report.prescription_id}`;
    const confirmation = this._fuseConfirmationService.open({
      title: "Delete Report?",
      message:
        "Are you sure you want to delete this report? This action cannot be undone!",
      actions: {
        confirm: {
          label: "Delete",
        },
      },
    });
    confirmation.afterClosed().subscribe((result) => {
      if (result === "confirmed") {
        this.httpService.getAll(url).subscribe(
          (res: any) => {
            if (res?.isSuccess && res.data) {
              this.GetPatientReportsCount(this.selectedPatientId);
              this.GetPrescriptionpreports();
            }
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      }
    });

  }
  onScroll(ev) {
    this.GetAllInvestigationReports(ev, this.selectedPatientId);
  }

}
