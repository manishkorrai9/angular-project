import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { APIService } from "app/core/api/api";
import { AuthService } from "app/core/auth/auth.service";
@Component({
  selector: "app-view-last-prescription-medication",
  templateUrl: "./view-last-prescription-medication.component.html",
  styleUrls: ["./view-last-prescription-medication.component.scss"],
})
export class ViewLastPrescriptionMedicationComponent implements OnInit {
  userInfo: any;
  latestMedicationList:any[]=[];
  constructor(
    public dialogRef: MatDialogRef<any>,
    private auth: AuthService,
    private httpService: APIService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.userInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
    console.log(this.data); 
    this.getLatestMedicationForCompletedAppointment(this.data.patientId,this.data.AppointmentId );
  }
  getLatestMedicationForCompletedAppointment(patienId, appointmentId) {
    const url = `api/Patient/GetLatestMedicationForCompletedAppointment?patientid=${patienId}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        console.log(res);
        if(res && res.data ){
          this.latestMedicationList = res.data; 
        }else{
          this.latestMedicationList =[];
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  takeMedicationToPrescription(){
    this.dialogRef.close(this.latestMedicationList);
    
  }
}
