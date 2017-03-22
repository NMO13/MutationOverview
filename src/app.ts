/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import * as d3_scale from 'd3-scale';
import * as d3_axis from 'd3-axis';
import * as d3_selection from 'd3-selection';
import * as d3_shape from 'd3-shape';
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

interface Renderable {
	render(data, params?: Object) : void;
}

class StackChart implements Renderable {
	render(data, params?: Object) : void {
		let keys = params[1];
		let svg = d3_selection.select("#chromosome-ov"),
		margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
		g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		var x = d3_scale.scaleBand()
			.rangeRound([0, width])
			.paddingInner(0.05)
			.align(0.1);

		var y = d3_scale.scaleLinear()
			.rangeRound([height, 0]);

		let colorArr = [];
		for(var i = 0; i < keys.length; i++)
			colorArr.push(randomColor());
		var z = d3_scale.scaleOrdinal()
			.range(colorArr);
			
		x.domain(data.map(function(d : History) { return d.chrom; }));
		y.domain([0, d3.max(data, function(d : History) { return d.total; })]).nice();
		z.domain(keys);
		
		var layers = d3_shape.stack().keys(keys)(data);
			
		let rects = g.append("g")
    .selectAll("g")
    .data(layers)
    .enter().append("g")
      .attr("fill", function(d) 
	  {
		  return z(d.key).toString(); 
		  })
    .selectAll("rect");
	
    rects.data(function(d) 
	{ 
	return [d[0], d[1]]; })
    .enter().append("rect")
      .attr("x", function(d) 
	  { 
		return x(d.data.chrom.toString()) 
		})
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth());
	  
	   g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3_axis.axisBottom(x));
	}
}

class BarChart implements Renderable {
    render(data) : void {
		let svg = d3_selection.select("#mutation-ov"),
		margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;
	
		let x = d3_scale.scaleBand().rangeRound([0, width]).padding(0.1),
		y = d3_scale.scaleLinear().rangeRound([height, 0]);
	
		let g = svg.append("g")
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
        let hist = {};
        this.array.map(function (a) {
            let property = a[propertyName];
            if (property in hist) hist[property]++; else hist[property] = 1;
        });
        return hist;
    }
	
	// code from http://codereview.stackexchange.com/questions/37028/grouping-elements-in-array-by-multiple-properties
	groupByProperties( f )
	{
	  let groups = {};
	  this.array.forEach( function( o )
	  {
		let group = JSON.stringify( f(o) );
		groups[group] = groups[group] || [];
		groups[group].push( o );  
	  });
	  return Object.keys(groups).map( function( group )
	  {
		return groups[group]; 
	  })
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

class History {
	constructor(keys) {
		for(let k of keys) {
			this[k] = 0;
		}
		this.total = 0;
		this.chrom = "";
	}
	total: number;
	chrom: string;
}

function start1() {
    let obj = new JsonDataService();
    let data = obj.getData("https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&order=desc").then(
        function (returndata) {
            let s: MutationConverter = {
                convert: function (data) {
                    let convertedArr = data.hits.map(function (datum) {
                        return new MutationDatum(datum.chromosome, datum.end, datum.id, datum.mutation, datum.start, datum.type);
                    });
                    return new MutationArray(convertedArr);
                }
            };
            let mutationArray = s.convert(returndata);

			let mutations = mutationArray.groupByProperties(function(item)
			{
				return [item.mutation];
			});
			
			let arr = [];
			arr = mutations.map(function(mutation) {
				return mutation.length > 0 ? [mutation[0].mutation, mutation.length] : [];
			});
			
			
            let bc = new BarChart();
            bc.render(arr);
			
			let chromosomes = mutationArray.groupByProperties(function(item)
			{
			  return [item.chromosome];
			});
			
			let keys = arr.map(function(mutation) {
				return mutation[0];
			});
			chromosomes = chromosomes.map(function(ch) {
				
				let hist = new History(keys);
				
				for(let mutationDatum of ch) {
					let m = mutationDatum.mutation;
					if (m in hist) hist[m]++; else hist[m] = 1;
					hist.chrom = mutationDatum.chromosome;
					hist.total++;
				}
				return hist;
			});
			
			let sc = new StackChart();
			sc.render(chromosomes, [mutations.length, keys]);
        });   
}

// Adapted from http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/

function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          };
		  
var randomColor = (function(){
  var golden_ratio_conjugate = 0.618033988749895;
  var h = Math.random();

  var hslToRgb = function (h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  };
	return function(){
		h += golden_ratio_conjugate;
		h %= 1;
		return hslToRgb(h, 0.5, 0.60);
	  };
	})();
