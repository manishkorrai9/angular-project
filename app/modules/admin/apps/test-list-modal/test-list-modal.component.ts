import {
  Component,
  OnInit,
  ViewChild,
  Inject,
  NgZone,
  ElementRef,
} from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  NgForm,
  Validators,
} from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { APIService } from "app/core/api/api";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "app/core/auth/auth.service";
import { ThemePalette } from "@angular/material/core";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import * as moment from "moment";
@Component({
  selector: "app-test-list-modal",
  templateUrl: "./test-list-modal.component.html",
  styleUrls: ["./test-list-modal.component.scss"],
})
export class TestListModalComponent implements OnInit {
  @ViewChild("picker") picker: any;

  public date: moment.Moment;
  sampleDate: any;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  selectedServices: any[] = [];
  approvedDate: any;
  public enableMeridian = false;
  currentDate: Date = new Date();

  public minDate: moment.Moment;
  // public maxDate: moment.Moment;
  maxDate: Date = new Date();
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = "primary";
  checkList: boolean[] = [];
  public stepHours = [1, 2, 3, 4, 5];
  public stepMinutes = [1, 5, 10, 15, 20, 25];
  public stepSeconds = [1, 5, 10, 15, 20, 25];
  TestsList: any[] = [];
  public options = [
    { value: true, label: "True" },
    { value: false, label: "False" },
  ];

  public listColors = ["primary", "accent", "warn"];
  testListForm: FormGroup;
  userInfo: any;
  lastAction: boolean = false;
  @ViewChild("testListFormNGForm") testListFormNGForm: NgForm;
  testData: any = [
    {
      masterdata_id: 1,
      test_name: "1, 25 Dihydroxy Vitamin D Serum",
    },

    {
      masterdata_id: 2,
      test_name: "17 Ketosteroids (Urine)",
    },
  ];
  billId: any;
  id: any;
  printTitle: string;
  name: any;
  @ViewChild("print") printBtn: ElementRef<HTMLElement>;
  constructor(
    private _matDialogRef: MatDialogRef<TestListModalComponent>,
    public dialogRef: MatDialogRef<any>,
    private fb: FormBuilder,
    private httpService: APIService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userInfo = JSON.parse(this.auth.user);
  }

  ngOnInit(): void {
    console.log(this.data.patient);

    console.log(this.userInfo);
    this.name = this.data.patient.patient_name;
    this.id = this.data.patient.patient_uniqueid;
    this.testListForm = this.fb.group({
      tests: this.fb.array([]),
    });

    this.date = moment();
    this.getTestsList();
  }
  dismiss() {
    this._matDialogRef.close();
  }

  get tests() {
    return this.testListForm.controls["tests"] as FormArray;
  }

  addTests(test: any, isDisabled: boolean) {
    const testForm = this.fb.group({
      patientId: [test.patient_id, Validators.required],
      hospitalServiceId: [test.hospital_service_id, Validators.required],
      paymentId: [test.payment_id, Validators.required],
      name: [test.test_name, Validators.required],
      dateControl: [{ value: test.sample_collection, disabled: isDisabled }],
      sample_result: [test.results],
      verified: [test.verification],
      sampletype: [test.sample_type],
      unit: [test.test_unit],
      range: [test.test_range],
      group_name: [test.group_name],
      approved_date: [test.report_approvedon],
      isHide: [isDisabled ? true : false],
      isChecked: [{ value: false, disabled: !test.verification }],
      result_type: [test.result_type ? test.result_type : ""],
    });

    this.tests.push(testForm);
  }

  closePicker() {
    this.picker.cancel();
  }
  getTestsList() {
    this.httpService
      .getAll(
        `api/Lab/GetPatienttest_bylabgroup?labuniqueid=${this.data.labId}&patientid=${this.data.patient.patient_id}`
      )
      .subscribe(
        (res: any) => {
          if (res.data) {
            this.TestsList = res.data;
            let sampleTypes = [];
            console.log(this.TestsList);

            this.TestsList.sort(
              (a, b) =>
                a.sample_type && a.sample_type.localeCompare(b.sample_type)
            );

            for (let i = 0; i < this.TestsList.length; i++) {
              let index = sampleTypes.indexOf(this.TestsList[i].sample_type);
              if (index == -1) {
                sampleTypes.push(this.TestsList[i].sample_type);
                this.addTests(this.TestsList[i], false);
              } else {
                this.addTests(this.TestsList[i], true);
              }
            }
            console.log(this.tests);
          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }
  onChange(item) {
    item.checked = !item.checked;

    this.lastAction = item.checked;

    console.log(this.lastAction);
  }
  getSampleDate(type: string) {
    let date: any;

    for (let i = 0; i < this.tests.value.length; i++) {
      if (
        this.tests.value[i].dateControl &&
        type == this.tests.value[i].sampletype
      ) {
        date = this.tests.value[i].dateControl;
        break;
      }
    }
    return date;
  }

  getVerifiedSample(type: string) {
    let isVerified: boolean;

    for (let i = 0; i < this.tests.value.length; i++) {
      if (
        this.tests.value[i].dateControl &&
        type == this.tests.value[i].sampletype
      ) {
        isVerified = this.tests.value[i].verified;
        break;
      }
    }
    return isVerified;
  }
  save() {
    const testListArray = [];
    this.tests.value.forEach((data) => {
      data.approved_date =
        data.approved_date && data.approved_date != "0001-01-01T00:00:00"
          ? data.approved_date
          : data.verified
          ? moment().format("YYYY-MM-DD[T]HH:mm:ss[Z]")
          : undefined;
      testListArray.push({
        paymentid: data.paymentId,
        hospitalserviceid: data.hospitalServiceId,
        samplecollection: data.dateControl
          ? data.dateControl
          : this.getSampleDate(data.sampletype),
        results: data.sample_result,
        result_type: data.result_type,
        labuniqueid: this.data.labId,
        patientid: data.patientId,
        test_name: data.name,
        labbillno: this.data.patient.lab_billno,
        createdby: this.userInfo.user_id,
        group_name: data.group_name,
        approved_date:
          data.approved_date && data.approved_date != "0001-01-01T00:00:00"
            ? data.approved_date
            : data.verified
            ? moment().format("YYYY-MM-DD[T]HH:mm:ss[Z]")
            : undefined,
        verification: data.verified
          ? data.verified
          : this.getVerifiedSample(data.sampletype),
      });
    });

    this.httpService
      .create("api/User/UpdatePatientServiceBillsByList", testListArray)
      .subscribe(
        (res: any) => {
          if (res?.isSuccess) {
            this.snackBar.open("Result saved successfully.", "close", {
              panelClass: "snackBarSuccess",
              duration: 2000,
            });
          } else {
            this.snackBar.open(res.data, "close", {
              panelClass: "snackBarWarning",
              duration: 2000,
            });
          }
        },
        (error: any) => {
          console.warn("error", error);
        }
      );
  }

  showOptions(event: any, data: any, index: number) {
    if (event.checked) {
      if (data.value.approved_date) {
        data.controls.isChecked.enable();
      }
    } else {
      data.controls.isChecked.disable();
    }
  }

  generateBill(isSendToPatient?: boolean) {
    console.log(this.tests.value);
    // data.lab_uniqueid,data.patient_id
    this.selectedServices = [];
    let serviceNames = [];
    let duplicateErrorFound = false;
    this.currentDate = new Date();

    this.tests.value.forEach((data) => {
      if (data.isChecked) {
        if (serviceNames.length == 0) {
          serviceNames.push(data.sampletype);
        } else if (serviceNames.indexOf(data.sampletype) == -1) {
          duplicateErrorFound = true;
        }
        if (!duplicateErrorFound) {
          this.selectedServices.push({
            test_name: data.name,
            dateControl: data.dateControl,
            results: data.sample_result,
            result_type: data.result_type,
            unit: data.unit,
            approved_date: data.approved_date,
            range: data.range,
          });
        }
      }
    });

    if (this.selectedServices.length == 0) {
      this.snackBar.open("Please select atleast one test.", "close", {
        panelClass: "snackBarWarning",
        duration: 2000,
      });
      return;
    }

    this.printTitle = `${this.data.patient.patient_name}_${
      serviceNames[0]
    }_${moment(this.currentDate).format("DD-MMM-YYYY")}`;
    this.sampleDate = this.selectedServices[0].dateControl;
    this.approvedDate = this.selectedServices[0].approved_date;

    if (!duplicateErrorFound) {
      setTimeout(() => {
        // let el: HTMLElement = this.printBtn.nativeElement;
        // el.click();

        this.generatePDF(isSendToPatient);
        // this.billLoading = false;
      }, 2000);
    } else {
      this.snackBar.open("Please select only one specimen type.", "close", {
        panelClass: "snackBarWarning",
        duration: 2000,
      });
    }
  }

  async generatePDF(isSendToPatient?: boolean) {
    // Invoice markup
    // Author: Max Kostinevich
    // BETA (no styles)
    // http://pdfmake.org/playground.html
    // playground requires you to assign document definition to a variable called dd

    // CodeSandbox Example: https://codesandbox.io/s/pdfmake-invoice-oj81y

    var dd = {
      content: [
        // Header

        // Billing Headers

        // Billing Details
        {
          columns: [
            {
              stack: [
                {
                  columns: [
                    {
                      text: "ID #",
                      style: "invoiceSubTitle",
                      width: "*",
                    },
                    {
                      text: this.id,
                      style: "invoiceSubValue",
                      width: 150,
                    },
                  ],
                },
                {
                  columns: [
                    {
                      text: "Name",
                      style: "invoiceSubTitle",
                      width: "*",
                    },
                    {
                      text: this.name,
                      style: "invoiceSubValue",
                      width: 150,
                    },
                  ],
                },
                {
                  columns: [
                    {
                      text: "Referred By",
                      style: "invoiceSubTitle",
                      width: "*",
                    },
                    {
                      text:
                        this.userInfo.first_name +
                        " " +
                        this.userInfo.last_name,
                      style: "invoiceSubValue",
                      width: 150,
                    },
                  ],
                },
              ],
            },

            [
              {
                stack: [
                  {
                    columns: [
                      {
                        text: "Sample Collected on",
                        style: "invoiceSubTitle",
                        width: "*",
                      },
                      {
                        text: moment(this.sampleDate).format(
                          "DD MMM, YYYY hh:mm a"
                        ),
                        style: "invoiceSubValue",
                        width: 120,
                      },
                    ],
                  },
                  {
                    columns: [
                      {
                        text: "Report Approved on",
                        style: "invoiceSubTitle",
                        width: "*",
                      },
                      {
                        text: moment(this.approvedDate).format(
                          "DD MMM, YYYY hh:mm a"
                        ),
                        style: "invoiceSubValue",
                        width: 120,
                      },
                    ],
                  },
                  {
                    columns: [
                      {
                        text: "Report Out on",
                        style: "invoiceSubTitle",
                        width: "*",
                      },
                      {
                        text: moment(this.currentDate).format(
                          "DD MMM, YYYY hh:mm a"
                        ),
                        style: "invoiceSubValue",
                        width: 120,
                      },
                    ],
                  },
                ],
              },
            ],
          ],
        },
        // Billing Address Title

        // Billing Address

        // Line breaks
        "\n\n",
        // Items
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              // Table Header
              [
                {
                  text: "TEST PARAMETER",
                  style: "itemsHeader",
                },
                {
                  text: "RESULT",
                  style: ["itemsHeader"],
                },
                {
                  text: "UNIT",
                  style: ["itemsHeader"],
                },
                {
                  text: "BIOLOGICAL REF. INTERVAL",
                  style: ["itemsHeader"],
                },
              ],

              ...this.selectedServices.map((p) => [
                p.test_name,
                {
                  text: p.result_type == "normal" ? p.results : p.results + "*",
                  style:
                    p.result_type == "normal"
                      ? "reslutsNormal"
                      : "resultsInNormal",
                },
                p.unit,
                p.range,
              ]),

              // Items
              // Item 1
              //  [
              //      {
              //          text:'1',
              //          style:'itemNumber'
              //      },
              //      {
              //          text:'1',
              //          style:'itemNumber'
              //      },
              //      {
              //          text:'$999.99',
              //          style:'itemNumber'
              //      },
              //      {
              //          text:'0%',
              //          style:'itemNumber'
              //      }

              //  ],
              // Item 2

              // END Items
            ],
          }, // table
          //  layout: 'lightHorizontalLines'
        },
        // TOTAL

        // Signature
      ],
      styles: {
        // Invoice Title
        invoiceTitle: {
          fontSize: 22,
          bold: true,
          alignment: "right",
          margin: [0, 0, 0, 15],
        },
        // Invoice Details
        invoiceSubTitle: {
          fontSize: 10,
          // 			alignment:'right'
        },

        resultsInNormal: {
          bold: true,
        },
        invoiceSubValue: {
          fontSize: 10,
          bold: true,
          margin: [0, 0, 0, 5],
          // 			alignment:'right'
        },
        // Billing Headers
        invoiceBillingTitle: {
          fontSize: 14,
          bold: true,
          alignment: "left",
          margin: [0, 20, 0, 5],
        },
        // Billing Details
        invoiceBillingDetails: {
          alignment: "left",
        },
        invoiceBillingAddressTitle: {
          margin: [0, 7, 0, 3],
          bold: true,
        },
        invoiceBillingAddress: {},
        // Items Header
        itemsHeader: {
          margin: [0, 5, 0, 5],
          bold: true,
        },
        // Item Title
        itemTitle: {
          bold: true,
        },
        itemSubTitle: {
          italics: true,
          fontSize: 11,
        },
        itemNumber: {
          margin: [2, 5, 0, 5],
        },
        itemTotal: {
          margin: [0, 5, 0, 5],
          bold: true,
          alignment: "center",
        },

        center: {
          alignment: "center",
        },
      },
      defaultStyle: {
        columnGap: 20,
      },
    };

    if (isSendToPatient) {
      const pdfDocGenerator = pdfMake.createPdf(dd);
      pdfDocGenerator.getBase64((data) => {
        this.saveLabReport(data);
      });
    } else {
      pdfMake.createPdf(dd).download(this.printTitle + ".pdf");
    }
  }

  saveLabReport(data: any) {
    const bodyInvestigation = {
      investigationid: 0,
      patientid: parseInt(this.data.patient.patient_id),
      recorddate: moment(this.currentDate).format("YYYY-MM-DD"),
      testname: undefined,
      docnotes: undefined,
      createdby: this.userInfo.user_id,
      reportfor: parseInt(this.data.patient.patient_id),
      reporttypeid: 57,
      "is_notify": true,
      "notify_msg": "Lab Techncian sent to report please check your lab report",    
      reportcategoryid: 57,
      investigationReportList: [
        {
          patientreportid: 0,
          filename: `${moment().format("DDMMYYYYHHmmss")}.pdf`,
          mimetype: "pdf",
          fileBase64: data,
        },
      ],
    };
    // const bodyPrescrition = {
    //   prescriptionid: 0,
    //   patientid: parseInt(this.patientId),
    //   recorddate: this.reportForm.controls.recordDate.value ? moment(this.reportForm.controls.recordDate.value).format("YYYY-MM-DD") : undefined,
    //   filename: this.reportForm.controls.fileName.value,
    //   docnotes: this.reportForm.controls.notes.value,
    //   createdby: this.userInfo.user_id,
    //   reportcategoryid: parseInt(this.reportForm.controls.reportType.value),
    //   patientReports: [
    //     {
    //       patientreportid: 0,
    //       filename: `${moment().format("DDMMYYYYHHmmss")}.${fileExtenstion}`,
    //       mimetype: this.mimetype,
    //       fileBase64: this.fileBase64
    //     }
    //   ]
    // }
    const url = `api/Investigations/ManageInvestigations`;
    this.httpService.create(url, bodyInvestigation).subscribe(
      (res: any) => {
        this.snackBar.open("report uploaded successfully. ", "close", {
          panelClass: "snackBarSuccess",
          duration: 2000,
        });
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }
}
