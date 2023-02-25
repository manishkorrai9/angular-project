import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { APIService } from 'app/core/api/api';
import { MatMenuPanel } from '@angular/material/menu';
import moment from "moment";

// import { TooltipPosition } from '@ng-matero/extensions/tooltip';

@Component({
  selector: 'app-daily-nutrition-details',
  templateUrl: './daily-nutrition-details.component.html',
  styleUrls: ['./daily-nutrition-details.component.scss']
})
export class DailyNutritionDetailsComponent implements OnInit {
  @ViewChild("menu") menu: MatMenuPanel;
  neutrition_log_details:any[] = [];

  date_type='Today';
  
  active_color:boolean=false;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  public dialogRef: MatDialogRef<any>,
 
  private httpService: APIService) { }

  ngOnInit(): void {
    console.log(this.data);
    this.getMedicineLogs(this.date_type);
  }
  sendDateType(datetype){
    this.active_color=true;
    this.date_type = datetype;
    this.getMedicineLogs(datetype)
  }
  getMedicineLogs(datetype?:any) {
    let date = moment().format('YYYY-MM-DD');
    const url = `api/PatientRegistration/Get_Nutrition_FoodLogByServeType_ByDateType?patientid=${this.data.userId}&datetype=${datetype}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if(res.data) {
          this.neutrition_log_details = res.data;
        }
      },
      (error: any) => { }
    );
  }
  get_micro_macro_individual(type,date){
    console.log(type);
    console.log(date);
    const url = `api/PatientRegistration/GetMicroMacroNutrients_IndividualItemCount?patientid=${this.data.userId}&trackon=${date}&nutriant_type=${type}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if(res.data) {
          this.menu = res.data;
        }
      },
      (error: any) => { }
    );
    //  return this.menu;
  }
}
