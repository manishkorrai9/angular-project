import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Blog } from "../blogs.types";

@Component({
  selector: "blogs-add",
  templateUrl: "./add.component.html",
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogsAddComponent implements OnInit, OnDestroy {
  drawerOpened: boolean = true;
  drawerMode: "over" | "side" = "side";
  composeForm: FormGroup;
  copyFields: { cc: boolean; bcc: boolean } = {
    cc: false,
    bcc: false,
  };
  preview:boolean = false;
  quillModules: any = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"], // toggled buttons
      ["clean"], // remove formatting button
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }], // superscript/subscript
      [{ color: [] }, { background: [] }], // dropdown with defaults from theme

      [{ align: [] }],

      ["link", "image", "video"], // link and image, video
    ],
  };

  quillFeatureImageModules: any = {
    toolbar: [
      ["image", "video"], // link and image, video
    ],
  };

  blog: Blog = {
    title: "Signs of Kidney Disease",
    content:
      '<p>&nbsp;&nbsp;&nbsp;&nbsp;</p><ol><li><strong>You\'re more tired, have less energy or are having trouble concentrating.</strong>&nbsp;A severe decrease in kidney function can lead to a buildup of toxins and impurities in the blood. This can cause people to feel tired, weak and can make it hard to concentrate. Another complication of kidney disease is&nbsp;<a href="https://www.kidney.org/atoz/content/what_anemia_ckd" style="box-sizing: inherit; margin: 0px; padding: 0px; border: 0px; outline: 0px; font-size: 16px; vertical-align: baseline; background: linear-gradient(to right, rgb(170, 166, 166), rgb(170, 166, 166)) left bottom / 100% 2px no-repeat, linear-gradient(to right, rgb(241, 100, 38), rgb(249, 151, 71)) 0% 0% / 0px 2px transparent; line-height: inherit; color: rgb(32, 30, 30); cursor: pointer; font-weight: 400; text-decoration: none; transition: all 0.5s ease 0s;">anemia</a>, which can cause weakness and fatigue.</li><li><strong>You\'re having trouble sleeping.</strong>&nbsp;When the kidneys aren\'t filtering properly, toxins stay in the blood rather than leaving the body through the urine. This can make it difficult to sleep. There is also a link between obesity and chronic kidney disease, and sleep apnea is more common in those with chronic kidney disease, compared with the general population.</li><li><strong>You have dry and itchy skin.&nbsp;</strong>Healthy kidneys do many important jobs. They remove wastes and extra fluid from your body, help make red blood cells, help keep bones strong and work to maintain the right amount of minerals in your blood.<strong>&nbsp;</strong>Dry and itchy skin can be a sign of the mineral and bone disease that often accompanies advanced kidney disease, when the kidneys are no longer able to keep the right balance of minerals and nutrients in your blood.</li><div class="se-component se-image-container __se__float-center" contenteditable="false"><figure style="margin: auto;"><img src="https://d3qv1kdjsarkxh.cloudfront.net/site_cuid_ckxk86a3s235781ks75o5uej7i/images/magazine-2-1640758195684-compressed.png" alt="" data-rotate="" data-proportion="true" data-rotatex="" data-rotatey="" data-align="center" data-size="," data-percentage="auto,auto" data-index="0" data-file-name="magazine-2-1640758196966-compressed.png" data-file-size="236165" data-origin="," style=""></figure></div><p><br></p><div class="se-component se-image-container __se__float-center" contenteditable="false"><figure style="margin: auto;"><img src="https://d3qv1kdjsarkxh.cloudfront.net/site_cuid_ckxk86a3s235781ks75o5uej7i/images/magazine-5-1640758467137-compressed.png" alt="" data-rotate="" data-proportion="true" data-rotatex="" data-rotatey="" data-align="center" data-size="," data-percentage="auto,auto" data-index="1" data-file-name="magazine-5-1640758468636-compressed.png" data-file-size="422667" data-origin="," style=""></figure></div></ol><p><br></p>',
    tasks: null,
    image: '<img src="https://d3qv1kdjsarkxh.cloudfront.net/site_cuid_ckxk86a3s235781ks75o5uej7i/images/magazine-5-1640758467137-compressed.png" alt="" data-rotate="" data-proportion="true" data-rotatex="" data-rotatey="" data-align="center" data-size="," data-percentage="auto,auto" data-index="1" data-file-name="magazine-5-1640758468636-compressed.png" data-file-size="422667" data-origin="," style="">',
    archived: false,
    category: "HealthCare",
  };

  steps: any = [
    {
      name: "Title words should be 8 - 12",
      current: 0,
      status: "passed",
    },
    {
      name: "Content words should be > 800",
      current: 0,
      status: "passed",
    },
    {
      name: "Images should be at least 2",
      current: 0,
      status: "passed",
    },
    {
      name: "Headings should be at least 2",
      current: 0,
      status: "passed",
    },
    {
      name: "Subheadings should be at least 1",
      current: 0,
      status: "passed",
    },
    {
      name: "Tags should be at least 2",
      current: 0,
      status: "passed",
    },
    {
      name: "Internal links should be > 1",
      current: 0,
      status: "passed",
    },
  ];
  blogId: string = undefined;
  loading:boolean = false;

  /**
   * Constructor
   */
  constructor(
    private _formBuilder: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.loading = true;
    var snapshot = route.snapshot;

    let currentRoute = snapshot;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    let id = currentRoute.paramMap.get("id");

    // Make sure there is no 'id' parameter on the current route
    if (!id) {
        this.blogId = undefined;
        this.loading = false;
    }else if(id && id == 'newblog'){
        this.blogId = undefined;
        this.loading = false;
    } else if(id && id !== 'newblog') {
        this.blogId = id;
        this.preview = true;
        this.loading = false;
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the form
    this.composeForm = this._formBuilder.group({
      name: ["", [Validators.required]],
      content: ["", [Validators.required]],
      featureImage: ["", [Validators.required]],
    });

    if(this.blogId) {
            // Patch values to the form
     this.composeForm.patchValue({
        name: this.blog ? this.blog.title : '',
        content: this.blog ? this.blog.content: '',
        featureImage: this.blog ? this.blog.image : ''
      });
  
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {}

  /**
   * Track by function for ngFor loops
   *
   * @param index
   * @param item
   */
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Show the copy field with the given field name
   *
   * @param name
   */
  showCopyField(name: string): void {
    // Return if the name is not one of the available names
    if (name !== "cc" && name !== "bcc") {
      return;
    }

    // Show the field
    this.copyFields[name] = true;
  }

  /**
   * Save and close
   */
  saveAndClose(): void {
    // Save the message as a draft
    this.saveAsDraft();

    // Close the dialog
    // this.matDialogRef.close();
  }

  /**
   * Discard the message
   */
  discard(): void {}

  /**
   * Save the message as a draft
   */
  saveAsDraft(): void {}

  /**
   * Send the message
   */
  send(): void {
      console.log(this.composeForm)
  }

  /**
   * view Blog 
   */
  previewDetails() : void {
    this.preview = !this.preview;
  }
}
