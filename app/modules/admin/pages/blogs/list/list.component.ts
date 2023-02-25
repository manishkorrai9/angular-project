import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, switchMap, take } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { BlogsLabelsComponent } from '../labels/labelS.component';
import { BlogsService } from '../blogs.service';
import { Label, Blog } from '../blogs.types';
import { cloneDeep } from 'lodash-es';
import { Router } from '@angular/router';

@Component({
    selector       : 'blogs-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogsListComponent implements OnInit, OnDestroy
{
    labels$: Observable<Label[]>;
    blogs$: Observable<Blog[]>;

    selectedCategory: number;

    cars = [
        { id: 1, name: 'Volvo' },
        { id: 2, name: 'Saab' },
        { id: 3, name: 'Opel' },
        { id: 4, name: 'Audi' },
    ];


    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    filter$: BehaviorSubject<string> = new BehaviorSubject('all');
    searchQuery$: BehaviorSubject<string> = new BehaviorSubject(null);
    masonryColumns: number = 4;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _matDialog: MatDialog,
        private _blogsService: BlogsService,
        private _router: Router
        
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the filter status
     */
    get filterStatus(): string
    {
        return this.filter$.value;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Request the data from the server
        this._blogsService.getLabels().subscribe();
        this._blogsService.getBlogs().subscribe();

        // Get labels
        this.labels$ = this._blogsService.labels$;
       // this.filterByLabel(this.labels$ )
        // Get blogs
        this.blogs$ = combineLatest([this._blogsService.blogs$, this.filter$, this.searchQuery$, this.labels$]).pipe(
            distinctUntilChanged(),
            map(([blogs, filter, searchQuery, labels]) => {

                if ( !blogs || !blogs.length )
                {
                    return;
                }
                

                // Store the filtered blogs
                let filteredBlogs = blogs;

                // Filter by query
                if ( searchQuery )
                {
                    searchQuery = searchQuery.trim().toLowerCase();
                    filteredBlogs = filteredBlogs.filter(blog => blog.title.toLowerCase().includes(searchQuery) || blog.content.toLowerCase().includes(searchQuery));
                }

                // Show all
                if ( filter === 'all' )
                {
                    // Do nothing
                    filteredBlogs = filteredBlogs.filter(blog => !!blog.labels.find(item => item.id === labels[0].id));
                }

                // Show archive
                const isArchive = filter === 'archived';
                filteredBlogs = filteredBlogs.filter(blog => blog.archived === isArchive);

                // Filter by label
                if ( filter.startsWith('label:') )
                {
                    const labelId = filter.split(':')[1];
                    filteredBlogs = filteredBlogs.filter(blog => !!blog.labels.find(item => item.id === labelId));
                }

                return filteredBlogs;
            })
        );

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {

                // Set the drawerMode and drawerOpened if the given breakpoint is active
                if ( matchingAliases.includes('lg') )
                {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                }
                else
                {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Set the masonry columns
                //
                // This if block structured in a way so that only the
                // biggest matching alias will be used to set the column
                // count.
                if ( matchingAliases.includes('xl') )
                {
                    this.masonryColumns = 4;
                }
                else if ( matchingAliases.includes('lg') )
                {
                    this.masonryColumns = 4;
                }
                else if ( matchingAliases.includes('md') )
                {
                    this.masonryColumns = 3;
                }
                else if ( matchingAliases.includes('sm') )
                {
                    this.masonryColumns = 2;
                }
                else
                {
                    this.masonryColumns = 1;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

   

    /**
     * Open the edit labels dialog
     */
    openEditLabelsDialog(): void
    {
        this._matDialog.open(BlogsLabelsComponent, {autoFocus: false});
    }

    

    /**
     * Filter by archived
     */
    filterByArchived(): void
    {
        this.filter$.next('archived');
    }

    /**
     * Filter by label
     *
     * @param labelId
     */
    filterByLabel(labelId: string): void
    {
        const filterValue = `label:${labelId}`;
        this.filter$.next(filterValue);
    }

    /**
     * Filter by query
     *
     * @param query
     */
    filterByQuery(query: string): void
    {
        this.searchQuery$.next(query);
    }

    /**
     * Reset filter
     */
    resetFilter(): void
    {
        this.filter$.next('blogs');
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

    openBlogDialog(blog:any) {
        console.log(blog);
       
        this._router.navigateByUrl('/'+blog.id);

    }
}
