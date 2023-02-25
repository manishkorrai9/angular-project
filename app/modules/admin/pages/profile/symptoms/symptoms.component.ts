import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { APIService } from "app/core/api/api";
import { BehaviorSubject } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-symptoms",
  templateUrl: "./symptoms.component.html",
  styleUrls: ["./symptoms.component.scss"],
})
export class SymptomsComponent implements OnInit {
  observations: any[] = [];
  @ViewChild("observationsInput")
  observationsInput: ElementRef<HTMLInputElement>;
  @ViewChild("auto2") matAutocomplete: MatAutocomplete;
  observationCtrl = new FormControl();
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredObervationsOptions$ = new BehaviorSubject<any[]>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
    private httpService: APIService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    console.log(this.data);

    let obj = this;
    if (
      this.data.complaints &&
      this.data.complaints.value &&
      this.data.complaints.value.length !== 0
    ) {
      this.observations = this.data.complaints.value.map(function (test: any) {
        return {
          patientid: parseInt(obj.data.patId),
          appointmentid: test.appointment_id,
          createdby: parseInt(obj.data.doctorId),
          isactive: true,
          complaintid: test.complaint_id,
          complaint_name: test.complaint,
        };
      });
    }
  }

  addOnBlur(event: FocusEvent) { 
    const target: HTMLElement = event.relatedTarget as HTMLElement;
    if (!target || target.tagName !== "MAT-OPTION") {
      const matChipEvent: MatChipInputEvent = {
        input: this.observationsInput.nativeElement,
        value: this.observationsInput.nativeElement.value,
      };
      this.addObservation(matChipEvent);
    }
  }

  addObservation(event: MatChipInputEvent): void {
    const input = event.input;
    const value = (event.value || "").trim();

    // Add our fruit
    if ((value || "").trim()) {
      const isOptionSelected = this.matAutocomplete.options.some(
        (option) => option.selected
      );
      if (!isOptionSelected) {
        this.observations.push({
          complaintid: 0,
          patientid: parseInt(this.data.patId),
          appointmentid: 0,
          createdby: parseInt(this.data.doctorId),
          isactive: true,
          complaint_name: value,
        });
      }
    }

    // Reset the input value
    if (input) {
      input.value = "";
    }

    this.observationCtrl.setValue(null);
  }

  removeObservation(lab: any): void {
    // const index = this.labs.indexOf(lab);
    // if (index >= 0) {
    //   this.labs.splice(index, 1);
    // }

    if (lab.complaintid) {
      lab.isactive = false;
    } else {
      this.observations = this.observations.filter(
        (obj) => obj.complaint_name !== lab.complaint_name
      );
    }

    // this.observations = this.observations.filter(obj => obj.complaint_name !== lab);
  }

  duplicateObservationsFound(testName) {
    let obj = this.observations.find((o) => o.complaint_name === testName);
    if (obj) {
      return true;
    } else {
      return false;
    }
  }

  selectedObervation(event: MatAutocompleteSelectedEvent): void {
    if (!this.duplicateObservationsFound(event.option.value)) {
      this.observations.push({
        complaintid: 0,
        patientid: parseInt(this.data.patId),
        appointmentid: 0,
        createdby: parseInt(this.data.doctorId),
        isactive: true,
        complaint_name: event.option.value,
      });
    }

    this.observationsInput.nativeElement.value = "";
    this.observationCtrl.setValue(null);
    // this.savePrescription(true);
  }

  searchObservationsTerm(event) {
    const value = event.target.value;
    const url = `api/User/GetSearchMasterData?mastercategoryid=70&searchtext=${value}`;
    this.httpService.getAll(url).subscribe(
      (res: any) => {
        if (res.data && res.data.length > 0) {
          this.filteredObervationsOptions$.next(res.data);
        } else {
          this.filteredObervationsOptions$.next([]);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  save() {
    const url = `api/Doctor/SavePatientSymptoms?patientId=${this.data.patId}&appointmentid=0`;
    this.httpService.create(url, this.observations).subscribe(
      (res: any) => {
        if (res.data) {
          this.snackBar.open(
            "Symptoms added successfully. ",
            "close",
            {
              panelClass: "snackBarSuccess",
              duration: 2000,
            }
          );
          this.dialogRef.close(true);
        }
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }

  cancel() {}
}
