/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import * as d3_scale from 'd3-scale';
import * as d3_axis from 'd3-axis';
import * as d3_selection from 'd3-selection';
import * as $ from 'jquery';
import {HELLO_WORLD} from './language';

/**
 * The main class for the App app
 */
export class App {

  private $node;

  constructor(parent:Element) {
    this.$node = d3_selection.select(parent);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<App>}
   */
  init() {
    return this.build();
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private build() {
    this.$node.html(HELLO_WORLD);
	start1();
    return Promise.resolve(null);
  }

  /**
   * Show or hide the application loading indicator
   * @param isBusy
   */
  setBusy(isBusy: boolean) {
    this.$node.select('.busy').classed('hidden', !isBusy);
  }

}

/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent:Element) {
  return new App(parent);
}

class BarChart {
    render(data) {
       var svg = d3_selection.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;
	
	var x = d3_scale.scaleBand().rangeRound([0, width]).padding(0.1),
    y = d3_scale.scaleLinear().rangeRound([height, 0]);
	
       var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	x.domain(data.map(function(d) { return d[0]; }));
  y.domain([0, d3.max(data, function(d) { return d[1]; })]);

  g.append("g")
	  .attr("class", "axis axis--x")
	  .attr("transform", "translate(0," + height + ")")
	  .call(d3_axis.axisBottom(x));

  g.append("g")
	  .attr("class", "axis axis--y")
	  .call(d3_axis.axisLeft(y).ticks(10));
	 
	g.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", "0.71em")
	  .attr("text-anchor", "end")
	  .text("Mutation Count");

  let bars = g.selectAll(".bar")
	.data(data)
	.enter().append("rect")
	  .attr("class", "bar")
	  .attr("x", function(d) { return x(d[0]); })
	  .attr("y", function(d) { return y(d[1]); })
	  .attr("width", x.bandwidth())
	  .attr("height", function(d) { return height - y(d[1]); });
	  
	  bars.append('title')
                 .text((d) => d[0] + ' - ' + d[1]);
	}
}

class MutationArray {
    constructor(public array: MutationDatum[]) { }
    groupCountByProperty(propertyName: string) {
        var hist = {};
        this.array.map(function (a)
        {
            var property = a[propertyName];
            if (property in hist) hist[property]++; else hist[property] = 1;
        });
        return hist;
    }
}

class MutationDatum {
    constructor(public chromosome: string, public end: string, public id: string,
        public mutation: string, public start: string, public type: string) {
    }
}

interface MutationConverter {
    convert: (data) => MutationArray;
}

interface MutationDataService {
    getData: (path: string) => any;
}

class JsonDataService implements MutationDataService {
    getData(path: string) {
        return $.getJSON(path, function (data, textstatus) {
        });
    }
}

function start1() {
    var obj = new JsonDataService();
    var data = obj.getData("https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&order=desc").then(
        function (returndata) {
            let s: MutationConverter = {
                convert: function (data) {
                    var convertedArr = data.hits.map(function (datum) {
                        return new MutationDatum(datum.chromosome, datum.end, datum.id, datum.mutation, datum.start, datum.type);
                    });
                    return new MutationArray(convertedArr);
                }
            }
            var mutationArray = s.convert(returndata);

			let dictionary = mutationArray.groupCountByProperty("mutation");
			
			let arr = [];
			for(var a in dictionary) {
				let x: [string, number];
				x = [a, dictionary[a]];
				arr.push(x);
			}
            let bc = new BarChart();
            bc.render(arr);
        });   
}
