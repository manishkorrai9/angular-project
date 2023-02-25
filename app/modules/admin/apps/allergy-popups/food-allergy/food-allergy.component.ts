import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, NgForm, Validators, AbstractControl } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { APIService } from "app/core/api/api";
import { ActivatedRoute } from "@angular/router";
import { Observable } from 'rxjs';
import { tap, map, startWith} from 'rxjs/operators';
import { DOWN_ARROW, UP_ARROW } from '@angular/cdk/keycodes'
@Component({
  selector: 'app-food-allergy',
  templateUrl: './food-allergy.component.html',
  styleUrls: ['./food-allergy.component.scss']
})
export class FoodAllergyComponent implements OnInit {
  submitted=false;
  filteredOptions: Observable<string[]>;
  fn: any;
  value: any;
  allFoodAllergies$ = new BehaviorSubject<any>(null);
  id:any;
  status: string[] = ["active", "inactive"];
  cars = [
    { id: 1, name: 'Milk' },
    { id: 2, name: 'Egg' },
    { id: 3, name: 'Cabbage' }
];
  foodAllergyForm: FormGroup;
  @ViewChild("foodAllergyNGForm") chiefComplaintNGForm: NgForm;
  allergies: any;
  newAllergies: any;
  reactions: any;
  editMode = false;
  found:any;
  constructor(
    private _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpService: APIService,
    public dialogRef: MatDialogRef<any>,
    private snackBar: MatSnackBar,
    private _activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
   
    this._activatedRoute.queryParams.subscribe((params) => {
      this.id = params["id"];
    });
    console.log(this.id)
    if (this.data && this.data.userId && this.data.foodAllergy) {
      this.editMode = true;
    }
    this.getFoodAllergies();
    this.getMasterDataInfo(12);
    this.getMasterDataInfo(13);

    // Create the form
    this.foodAllergyForm = this._formBuilder.group({
      allergyName: [null, [Validators.required]],
      status: ["", [Validators.required]],
      reaction: [null, [Validators.required]]
    });

    this.foodAllergyForm.patchValue({
      allergyName: this.data.foodAllergy ? this.data.foodAllergy.allergen : '',
      status: this.data.foodAllergy ? this.data.foodAllergy.status.toLowerCase() : '',
      reaction: this.data.foodAllergy ? this.data.foodAllergy.reactions : '',
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
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  get f(): { [key: string]: AbstractControl } {
    return this.foodAllergyForm.controls;
  }
  onSubmit() {
    let allergyList=[];
    allergyList.push(this.foodAllergyForm.controls.allergyName.value);
    if(this.found && !this.editMode){
      this.snackBar.open('Food allergy already there. ', 'close', {
        panelClass: "snackBarError",
        duration: 2000,
      });
    }else{
      this.submitted = true;
      if (this.foodAllergyForm.invalid) {
        return;
      }
      const body = {
        foodid: this.editMode ? this.data.foodAllergy.food_id : 0,
        patientid: parseInt(this.data.userId),
        appointmentid: 0,
        allergen_list: allergyList,
        reactions_list: this.foodAllergyForm.controls.reaction.value,
        status_name: this.foodAllergyForm.controls.status.value ? this.foodAllergyForm.controls.status.value.toLowerCase() : undefined,
      };
      const url = 'api/PatientRegistration/SavePatientFoodAllergy';
      this.httpService.create(url, body).subscribe((res: any) => {
        this.dialogRef.close(true);
        this.snackBar.open('Food allergy added successfully. ', 'close', {
          panelClass: "snackBarSuccess",
          duration: 2000,
        });
      },
      (error: any) => {
          console.log('error', error);
      });
      console.log(JSON.stringify(this.foodAllergyForm.value, null, 2));
    }
   
  }
  onReset(): void {
    this.submitted = false;
    this.foodAllergyForm.reset();
    this.dialogRef.close();
  }

  getMasterDataInfo(type) {
    const url = `api/User/GetMasterData?mastercategoryid=`+type;
    this.httpService.getAll(url).subscribe((res: any) => {
        switch(type) {
          case 4:
            this.status = res.data;
            break;
          case 12: 
            this.allergies = res.data;
            break;
          case 13: 
            this.reactions = res.data;
            break;
          default:
      }
      if (type ==  12) {
        this.filteredOptions = this.foodAllergyForm.controls.allergyName.valueChanges
        .pipe(
          startWith(''),
          map(value => this.searchAllergies(value)),
          tap(value => this.value = value)
        );
      }
    
    },
    (error: any) => {
        console.log('error', error);
    });
  }
  _temp_list:any;
  _new_temp_list:any;
  getFoodAllergies() {
    const url = `api/PatientRegistration/GetPatientFoodAllergies?patientid=${this.id}&appointmentId=0`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data) {
          this.allFoodAllergies$.next(res.data);
          this._temp_list = res.data.reduce((accumulator, obj) => [...accumulator, ...obj.allergen], []);
        } else {
          this.allFoodAllergies$.next([]);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
  
  checkDuplicate(val){
    this.found = this._temp_list.some(r=> val.indexOf(r) >= 0)
  }
  
   searchAllergies(value:string) {
    this.newAllergies=this.allergies;
    const filterValue = value.toLowerCase();
    this.newAllergies = this.newAllergies.filter(option => option.data_name.toLowerCase().includes(filterValue));
    return this.newAllergies.length ? this.newAllergies : [{data_name:'No data'}];
  }

  _allowSelection(option: string): { [className: string]: boolean } {
    return {
      'no-data': option === 'No data',
    }
  }

}
