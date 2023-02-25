import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, NgForm, Validators, AbstractControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { APIService } from "app/core/api/api";

import { Observable } from 'rxjs';
import { tap, map, startWith} from 'rxjs/operators';
import { DOWN_ARROW, UP_ARROW } from '@angular/cdk/keycodes'

@Component({
  selector: 'app-drug-allergy',
  templateUrl: './drug-allergy.component.html',
  styleUrls: ['./drug-allergy.component.scss']
})
export class DrugAllergyComponent implements OnInit {
  submitted=false;
  status: string[] = ["active", "inactive"];
  DrugAllergies: any;
  newDrugAllergies:any;
  drugAllergForm: FormGroup;
  filteredOptions: Observable<string[]>;
  fn: any;
  value: any;
  @ViewChild("drugAllergyNGForm") chiefComplaintNGForm: NgForm;
  allergies: string[] = [];
  reactions: any;
  //status: any;
  editMode = false;
  constructor(
    private _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpService: APIService,
    public dialogRef: MatDialogRef<any>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.userId && this.data.drugAllergy) {
      this.editMode = true;
    }
    this.getMasterDataInfo(14);
    this.getMasterDataInfo(13);
    // Create the form
    this.drugAllergForm = this._formBuilder.group({
      allergyName: [null, [Validators.required]],
      status: ["", [Validators.required]],
      reaction:[null, [Validators.required]]
    });
    this.fn = (evt: KeyboardEvent) => {
      if (evt.keyCode === DOWN_ARROW || evt.keyCode === UP_ARROW) {
        console.log(this.value);
          if (this.value && this.value.length === 1 && this.value[0] === 'No data') {
            evt.stopPropagation();
          }
      }
    }
  
    document.addEventListener('keydown', this.fn, true);
   
  }
  ngOnDestroy() {
    document.removeEventListener('keydown', this.fn);
  }
  get f(): { [key: string]: AbstractControl } {
    return this.drugAllergForm.controls;
  }
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  patchForm() {
    console.log(this.data);
    this.drugAllergForm.patchValue({
      allergyName: this.data.drugAllergy ? this.data.drugAllergy.allergen : '',
      status: this.data.drugAllergy ? this.data.drugAllergy.status.toLowerCase() : '',
      reaction: this.data.drugAllergy ? this.data.drugAllergy.reactions : '',
    });
  }
  onSubmit() {
    this.allergies.push(this.drugAllergForm.controls.allergyName.value);
    this.submitted = true;
    let allergyList=[this.drugAllergForm.controls.allergyName.value];
    const body = {
      drugid: this.editMode ? this.data.drugAllergy.drug_id : 0,
      patientid: parseInt(this.data.userId),
      appointmentid: 0,
      allergen_list: allergyList,
      reactions_list: this.drugAllergForm.controls.reaction.value,
      status_name: this.drugAllergForm.controls.status.value ? this.drugAllergForm.controls.status.value.toLowerCase() : undefined,
     // onsetdate: 
     // createdby: 0
    };
    const url = 'api/PatientRegistration/SavePatientDrugAllergy';
    this.httpService.create(url, body).subscribe((res: any) => {
      this.dialogRef.close(true);
      this.snackBar.open('Drug allergy added successfully. ', 'close', {
        panelClass: "snackBarSuccess",
        duration: 2000,
      });
    },
    (error: any) => {
        console.log('error', error);
    });
  }
  onReset(): void {
    this.submitted = false;
    this.drugAllergForm.reset();
    this.dialogRef.close();
  }

  getMasterDataInfo(type) {
    const url = `api/User/GetMasterData?mastercategoryid=`+type; 
    this.httpService.getAll(url).subscribe((res: any) => {         
      // this.reactions = res.data;
      switch(type) {
        case 14: 
          this.DrugAllergies = res.data;
          break;
        case 13: 
          this.reactions = res.data;
          break;
        default:
    }
    if (type ==  14) {
      this.filteredOptions = this.drugAllergForm.controls.allergyName.valueChanges
      .pipe(
        startWith(''),
        map(value => this.searchAllergies(value)),
        tap(value => this.value = value)
      );
    }
    this.patchForm();
    },
    (error: any) => {
        console.log('error', error);
    });
  }
  // searchAllergies(ev){
  //   const value = ev.target.value;
  //   this.newDrugAllergies=this.DrugAllergies;
  //   console.log(value);
  //   if (value && value.trim() != "") {
  //     this.newDrugAllergies = this.newDrugAllergies.filter((item: any) => {
  //       return (
  //         item.data_name.toLowerCase().indexOf(value.toLowerCase()) > -1
  //       );
  //     });
  //   }
  // }
  searchAllergies(value:string) {
    this.newDrugAllergies=this.DrugAllergies;
    const filterValue = value.toLowerCase();
    this.newDrugAllergies = this.newDrugAllergies.filter(option => option.data_name.toLowerCase().includes(filterValue));
    return this.newDrugAllergies.length ? this.newDrugAllergies : [{data_name:'No data'}];
  }
  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      'no-data': option === 'No data',
    }
  }

}
