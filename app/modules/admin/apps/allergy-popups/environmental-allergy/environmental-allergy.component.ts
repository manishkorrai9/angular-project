import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, NgForm, Validators, AbstractControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { APIService } from "app/core/api/api";

import { Observable } from 'rxjs';
import { tap, map, startWith} from 'rxjs/operators';
import { DOWN_ARROW, UP_ARROW } from '@angular/cdk/keycodes'

@Component({
  selector: 'app-environmental-allergy',
  templateUrl: './environmental-allergy.component.html',
  styleUrls: ['./environmental-allergy.component.scss']
})
export class EnvironmentalAllergyComponent implements OnInit {
  submitted=false;
  status: string[] = ["active", "inactive"];
  environmentAllergyForm: FormGroup;
  filteredOptions: Observable<string[]>;
  fn: any;
  value: any;
  @ViewChild("environmentAllergyNGForm") chiefComplaintNGForm: NgForm;
  envAllergies: any;
  newenvAllergies:any;
  envReactions: any;
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
    if (this.data && this.data.userId && this.data.envAllergy) {
      this.editMode = true;
    }
    this.getMasterDataInfo(15);
    this.getMasterDataInfo(13);
    this.getMasterDataInfo(14);
    // Create the form
    this.environmentAllergyForm = this._formBuilder.group({
      allergyName: [null, [Validators.required]],
      status: ["", [Validators.required]],
      reaction:["", [Validators.required]]
    });

    this.environmentAllergyForm.patchValue({
      allergyName: this.data.envAllergy ? this.data.envAllergy.allergen : '',
      status: this.data.envAllergy ? this.data.envAllergy.status.toLowerCase() : '',
      reaction: this.data.envAllergy ? this.data.envAllergy.reactions : '',
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
    return this.environmentAllergyForm.controls;
  }
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  onSubmit() {
    let allergyList=[this.environmentAllergyForm.controls.allergyName.value];
    console.log('Entered')
    this.submitted = true;
    if (this.environmentAllergyForm.invalid) {
      return;
    }
    const body = {
      environmentid: this.editMode ? this.data.envAllergy.environment_id : 0,
      patientid: parseInt(this.data.userId),
      appointmentid: 0,
      allergen_list: allergyList,
      reactions_list: this.environmentAllergyForm.controls.reaction.value,
      status_name: this.environmentAllergyForm.controls.status.value ? this.environmentAllergyForm.controls.status.value.toLowerCase() : undefined,
     // onsetdate: 
     // createdby: 0
    };
    const url = 'api/PatientRegistration/SavePatientEnvironmentAllergy';
    this.httpService.create(url, body).subscribe((res: any) => {
      this.dialogRef.close(true);
      this.snackBar.open('Environmental allergy added successfully. ', 'close', {
        panelClass: "snackBarSuccess",
        duration: 2000,
      });
    },
    (error: any) => {
        console.log('error', error);
    });
    console.log(JSON.stringify(this.environmentAllergyForm.value, null, 2));
  }
  onReset(): void {
    this.submitted = false;
    this.environmentAllergyForm.reset();
    this.dialogRef.close();
  }

  getMasterDataInfo(type) {
    const url = `api/User/GetMasterData?mastercategoryid=`+type;
    
    this.httpService.getAll(url).subscribe((res: any) => {
        switch(type) {
          case 15: 
            this.envAllergies = res.data;
            break;
          case 13: 
            this.envReactions = res.data;
            break;
          default:
      }
      if (type ==  15) {
        this.filteredOptions = this.environmentAllergyForm.controls.allergyName.valueChanges
        .pipe(
          startWith(''),
          map(value => this.searchAllergies(value)),
          tap(value => this.value = value)
        );
      }
      console.log(this.envAllergies);
    },
    (error: any) => {
        console.log('error', error);
    });
  }
  // searchAllergies(ev){
  //   const value = ev.target.value;
  //   this.newenvAllergies=this.envAllergies;
  //   console.log(value);
  //   if (value && value.trim() != "") {
  //     this.newenvAllergies = this.newenvAllergies.filter((item: any) => {
  //       return (
  //         item.data_name.toLowerCase().indexOf(value.toLowerCase()) > -1
  //       );
  //     });
  //   }
  // }
  searchAllergies(value:string) {
    this.newenvAllergies=this.envAllergies;
    const filterValue = value.toLowerCase();
    this.newenvAllergies = this.newenvAllergies.filter(option => option.data_name.toLowerCase().includes(filterValue));
    return this.newenvAllergies.length ? this.newenvAllergies : [{data_name:'No data'}];
  }

  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      'no-data': option === 'No data',
    }
  }

}
