import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-circular-progress-chart',
  templateUrl: './circular-progress-chart.component.html',
  styleUrls: ['./circular-progress-chart.component.scss']
})
export class CircularProgressChartComponent implements OnInit {

  @Input() chartTitle: string;
  @Input() chartColors: string[];
  @Input() chartData: column[];

  @Input() allChartData: column[];

  circleArray: circle[] = [
   
    { vector: "M18 5 a 13 13 0 0 1 0 26 a 13 13 0 0 1 0 -26", circumferance: 80.4 },
    // { vector: "M18 7 a 10 1 0 0 1 0 20 a 11 11 0 0 1 0 -20", circumferance: 60 },
     { vector: "M18 7 a 11 11 0 0 1 0 22 a 11 11 0 0 1 0 -22", circumferance: 68 }
  ];

  dashArray: Array<number[]>;
  totalValue: number;

  constructor() { }

  ngOnInit() {
    this.totalValue = this.getTotalValue();
    this.dashArray = this.getStrokeDashArray();
    console.log(this.dashArray);
    console.log(this.allChartData);
  }

  getStrokeDashArray(): Array<number[]> {
    let result: Array<number[]> = [];
    for (let i = 0; i < this.chartData.length; i++) {
      //let percent = Math.round((this.chartData[i].Value / this.allChartData[i].Value) * 100);
      let percent = Math.floor((this.chartData[i].Value / this.allChartData[i].Value) * 100);
      this.chartData[i].percentage = percent;
      let percentageValue = (percent * this.circleArray[i].circumferance) / 100;
      let resultArray = [percentageValue, this.circleArray[i].circumferance];
      result.push(resultArray);
    }
    console.log(result);
    return result;
  }

  getTotalValue(): number {
    let result = 0;
    for (let i = 0; i < this.chartData.length; i++) {
      result = result + this.chartData[i].Value;
    }
    return result;
  }

}

export class column {
  Name: string;
  Value: number;
  percentage?: number;
}

export class circle {
  vector: string;
  circumferance: number;
}


