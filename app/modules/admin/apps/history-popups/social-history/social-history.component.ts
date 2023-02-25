import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, NgForm, Validators,AbstractControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { APIService } from "app/core/api/api";

@Component({
  selector: 'app-social-history',
  templateUrl: './social-history.component.html',
  styleUrls: ['./social-history.component.scss']
})
export class SocialHistoryComponent implements OnInit {
  Smoking_Status: string[] = ["Current Smoker", "Past Smoker", "Non Smoker"];
  alcohol_Status: string[] = ["Current Alcoholic", "Past Alcoholic", "Non Alcoholic"];
  cheifComplaintForm: FormGroup;
  submitted=false;
  smoking_historyid:any;
  alcohol_historyid:any;
  @ViewChild("cheifComplaintNGForm") chiefComplaintNGForm: NgForm;
  smokingaacholFrequencies: any;

  constructor(
    private _formBuilder: FormBuilder,
    private httpService: APIService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>
  ) {}

  ngOnInit(): void {
    // Create the form
    this.cheifComplaintForm = this._formBuilder.group({
      smoking: ["", [Validators.required]],
      _smoking_quantity:[""],
      _smoking_frequency:[""],
      alcohol: [""],
      _alcohol_quantity:[""],
      _alcohol_frequency:[""],
      
    });
    this.getSmokingAlcholFrequency();
    // this.smoking_historyid=this.data.smoking.smoking_historyid;
    if (this.data && this.data?.smoking && this.data.smoking.smoking_historyid) {
      this.updateSmokongForm();
    }
    // this.alcohol_historyid=this.data.alchol.alcohol_historyid;
    if (this.data && this.data?.alchol && this.data.alchol.alcohol_historyid) {
      this.updateAlcholForm();
    }
  }

  updateSmokongForm() {
    this.cheifComplaintForm.patchValue({
      smoking: this.data.smoking.smoking_history == true ? 'Current Smoker' : this.data.smoking.past_smoker == true ? 'Past Smoker' : 'Non Smoker',
      _smoking_quantity: this.data.smoking.smoking_quantity,
      _smoking_frequency: this.data.smoking.smoking_frquencyid,
    })
  }

  updateAlcholForm() {
    this.cheifComplaintForm.patchValue({
      alcohol: this.data.alchol.alcohol_history == true ? 'Current Alcoholic' : this.data.alchol.past_alcoholic == true ? 'Past Alcoholic' : 'Non Alcoholic',
      _alcohol_quantity: this.data.alchol.alcohol_quantity,
      _alcohol_frequency: this.data.alchol.alcohol_frquencyid,
    })
  }

  get f(): { [key: string]: AbstractControl } {
    return this.cheifComplaintForm.controls;
  }
  onSubmit() {
    this.submitted = true;
    if (this.cheifComplaintForm.invalid) {
      return;
    }
    if (this.cheifComplaintForm.get('smoking').value !== '') {
      const smokingData = {
        smokinghistoryid: this.data?.smoking ? this.data.smoking.smoking_historyid : 0,
        patientid: parseInt(this.data.userId),
        appointmentid: 0,
        smokinghistory: this.cheifComplaintForm.get('smoking').value === 'Current Smoker' ? true : false,
        smokingquantity: this.cheifComplaintForm.get('_smoking_quantity').value ? this.cheifComplaintForm.get('_smoking_quantity').value : "0",
        smokingfrquencyid: this.cheifComplaintForm.get('_smoking_frequency').value ? this.cheifComplaintForm.get('_smoking_frequency').value : 0,
        smokingstatus: this.cheifComplaintForm.get('smoking').value === 'Current Smoker' ? 27 : 28,
        pastsmoker: this.cheifComplaintForm.get('smoking').value === 'Past Smoker' ? true : false,
      };
      this.saveSmokingHistory(smokingData);
    }
    if (this.cheifComplaintForm.get('alcohol').value !== '') {
      const alcholData = {
        alcoholhistoryid: this.data?.alchol ? this.data.alchol.alcohol_historyid : 0,
        patientid: parseInt(this.data.userId),
        appointmentid: 0,
        alcoholhistory: this.cheifComplaintForm.get('alcohol').value === 'Current Alcoholic' ? true: false,
        alcoholquantity: this.cheifComplaintForm.get('_alcohol_quantity').value ? this.cheifComplaintForm.get('_alcohol_quantity').value : "0",
        alcoholfrquencyid: this.cheifComplaintForm.get('_alcohol_frequency').value ? this.cheifComplaintForm.get('_alcohol_frequency').value : 0,
        alcoholstatus: this.cheifComplaintForm.get('alcohol').value === 'Current Alcoholic' ? 27 : 28,
        pastalcoholic: this.cheifComplaintForm.get('alcohol').value === 'Past Alcoholic' ? true : false,
      };
      this.saveAlcholHistory(alcholData);
    }
    console.log(JSON.stringify(this.cheifComplaintForm.value, null, 2));
  }
  onReset(): void {
    this.submitted = false;
    this.cheifComplaintForm.reset();
    this.dialogRef.close();
  }

  getSmokingAlcholFrequency() {
    const url = `api/User/GetMasterData?mastercategoryid=23`;
    this.httpService.getAll(url).subscribe((res: any) => {
      this.smokingaacholFrequencies = res.data; 
    });
  }

  saveSmokingHistory(body) {
    const url = `api/SocialAndSurgicalHistory/SaveSmokingHistory`;
    this.httpService.create(url, body).subscribe((res: any) => {
      console.log(res);
      if(res.data){ 
        this.snackBar.open("Social history saved successfully.", "close", {
          panelClass: "snackBarSuccess",
          duration: 2000,
        });
      }
        
      this.dialogRef.close(true);
    });
  }

  saveAlcholHistory(body) {
    const url = `api/SocialAndSurgicalHistory/SaveAlchohalHistory`;
    this.httpService.create(url, body).subscribe((res: any) => {
      console.log(res);
      if(res.data){ 
        this.snackBar.open("Social history saved successfully.", "close", {
          panelClass: "snackBarSuccess",
          duration: 2000,
        });
      }
      this.dialogRef.close(true);
    });
  }

}
