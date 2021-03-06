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
import * as d3_transition from 'd3-transition';

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
	this.setBusy(false);
	this.$node.select('h3').remove();
	
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

interface IRenderable {
	render(data, params?: Object) : void;
	update(data, params?: Object) : void;
}

class StackChart implements IRenderable {
	_data : Array<History>;
	_keys : Array<string>;
	_barChart : IRenderable;
	_clicked : boolean;
	
	constructor() {
		this._clicked = false;
	}
	
	render(data, params?: Object) : void {
		this._keys = params[0] || this._keys;
		this._barChart = params[1] || this._barChart;
		this._data = data || this._data;
		const _this = this;
		data.map(function(h : History) {h.obj = _this;});
		const svg = d3_selection.select('#chromosome-ov'),
		margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = +svg.attr('width') - margin.left - margin.right - 30,
		height = +svg.attr('height') - margin.top - margin.bottom,
		g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		
		const x = d3_scale.scaleBand()
			.rangeRound([0, width])
			.paddingInner(0.05)
			.align(0.1);

		const y = d3_scale.scaleLinear()
			.rangeRound([height, 0]);
		
		x.domain(data.map(function(d : History) { return d.chrom; }));
		y.domain([0, d3.max(data, function(d : History) { return d.total; })]).nice();
		
		const c20 = d3.scale.category20();
		c20.domain(this._keys);

		
		const layers = d3_shape.stack().keys(this._keys)(data);
			
		const rects = g.append('g')
		.selectAll('g')
		.data(layers)
		.enter().append('g')
		.attr('fill', function(d) { 
			return c20(d.key).toString(); 
		})
		.selectAll('rect');
		
		rects.data(function(d) 
		{
			for (const entry of d) {
				(<any>entry).mutation = d.key;
			}
			return <{}[]> d; 
		})
		.enter().append('rect')
		.attr('x', function(d) { return x((<any>d).data.chrom).toString(); })
		.attr('y', function(d) { return y(d[1]); })
		.attr('height', function(d) { return y(d[0]) - y(d[1]); })
		.attr('width', x.bandwidth())
		.attr('class', 'barsc')  
		.on('click', this.handleClick)
		.append('title')
		  .text((d) => (<any>d).mutation + ': ' + (d[1]-d[0]).toString());

		g.append('g')
		.attr('class', 'axis axis--xsc')
		.attr('transform', 'translate(0,' + height + ')')
		.call(d3_axis.axisBottom(x));

		g.append('g')
		.attr('class', 'axis')
		.call(d3_axis.axisLeft(y).ticks(null, 's'))
		.append('text')
		.attr('x', 2)
		.attr('y', y(y.ticks().pop()) + 0.5)
		.attr('dy', '0.32em')
		.attr('fill', '#000')
		.attr('font-weight', 'bold')
		.attr('text-anchor', 'start')
		.text('Mutation Distribution');

		const legend = g.append('g')
		.attr('font-family', 'sans-serif')
		.attr('font-size', 10)
		.attr('text-anchor', 'end')
		.selectAll('g')
		.data(layers)
		.enter().append('g')
		.attr('transform', function(d, i) { return 'translate(50,' + i * 20 + ')'; });

		legend.append('rect')
		  .attr('x', width - 19)
		  .attr('width', 19)
		  .attr('height', 13)
		  .attr('fill', function(d) {
			  return c20(d.key);
			  })
		  .attr('class', 'legend_label')
		  .on('click', this.clickLegend);

		legend.append('text')
		  .attr('x', width - 24)
		  .attr('y', 9.5)
		  .attr('dy', '0.32em')
		  .text(function(d) { 
			return d.key; 
		  });
	}
	
	clickLegend(d, i) {
		const sc =  (<any>d[0].data).obj;
		const obj = [];
		obj.push(d.key);
		obj.push(i);
		(<any>obj).obj = sc._barChart;
		sc._barChart.handleClick(obj, i);
	}
	
	selectBar(d, i) {
		const sc = d.data.obj;
		if(!sc._clicked) {
			sc._clicked = true;
			sc.update([d.data], []);
			
			const newData = [];
			for(const key of sc._keys) {
				if(d.data[key] > 0) {
					const el = sc._barChart._data.find((x) => x[0] === key);
					newData.push(el);
				}
			}
			sc._barChart.update(newData, []);
		}
	}
	
	handleClick(d, i) {
		const sc = d.data.obj;
		for(const key of sc._keys) {
				if(key !== d.mutation) {
					d.data[key] = 0;
				}
			}
		sc.selectBar(d, i);
	}
	
	update(data, params?: Object) : void {
		const g = d3_selection.select('#chromosome-ov > g');
		g.remove();
		this.render(data, params);
	}

}

class BarChart implements IRenderable {
	_data : Array<History>;
	_keys : Array<string>;
	_colorArray : Array<Object>;
	_clicked : boolean;
	_stackChart : IRenderable;
	private _node : any;
	private width : number;
	private height : number;
	private x : any;
	private y : any;
	
	constructor() {
		this._clicked = false;
		const svg = d3_selection.select('#mutation-ov'),
		margin = {top: 20, right: 20, bottom: 30, left: 40};
		this.width = +svg.attr('width') - margin.left - margin.right;
		this.height = +svg.attr('height') - margin.top - margin.bottom;
	
		this.x = d3_scale.scaleBand().rangeRound([0, this.width]).padding(0.1);
		this.y = d3_scale.scaleLinear().rangeRound([this.height, 0]);
	
		this._node = svg.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		

		this._node.append('g')
		  .attr('class', 'axis axis--y')
		  .call(d3_axis.axisLeft(this.y).ticks(10));
		  
	 
		this._node.append('text')
		  .attr('transform', 'rotate(-90)')
		  .attr('y', 6)
		  .attr('dy', '0.71em')
		  .attr('text-anchor', 'end')
		  .text('Mutation Count');

	}
	
    render(data, params?: Object) : void {
		this._keys = params[0] || this._keys;
		this._stackChart = params[1] || this._stackChart;
		
		const _this = this;
		const keys = this._keys;
		const x = this.x, y = this.y, height = this.height;
		
		  
		data.forEach((x) => x.obj = _this);
	
		x.domain(data.map(function(d) { return d[0]; }));
		y.domain([0, d3.max(data, function(d) { return d[1]; })]);


		this._node.append('g')
		  .attr('class', 'axis axis--xbc')
		  .attr('transform', 'translate(0,' + this.height + ')')
		  .call(d3_axis.axisBottom(this.x));
				
		const c20 = d3.scale.category20();
		c20.domain(this._keys);
		  
		// if we have selected anything, update it
		if(this._data !== undefined) {
			d3.selectAll('.barbc').data(data, function(d)
			{
				return d[0];
			}).exit()
			.transition()
			.duration(3000)
			.attr('height', 0)
			.attr('y', function(d) { return height; })
			.remove();
		} else {
			const bars = this._node.selectAll('.barbc')
			.data(data, function(d) 
			{ 
			return d[0]; 
			});
			bars.enter().append('rect')
			  .attr('class', 'barbc')
			  .attr('x', function(d) { return x(d[0]); })
			  .attr('y', function(d) { return y(d[1]); })
			  .attr('width', x.bandwidth())
			  .attr('height', function(d) { 
			  return height - y(d[1]); 
			  })
			  .attr('fill', function(d) { 
				return c20(keys.find((x) => d[0] === x));
				})
			  .on('click', this.handleClick);
			 
  
			bars.append('title')
			  .text((d) => d[0] + ' - ' + d[1]);
			  
			this._data = data;
		}
		  
	}
	
	update(data, params?: Object) : void {
		//let g = d3_selection.select("#mutation-ov > g");
		//g.remove();
		this.render(data, params);
	}
	
	handleClick(d, i) {
		const bc = d.obj;
		if(!bc._clicked) {
			bc._clicked = true;
			const key = bc._keys[i];
			bc.update([d], []);
			
			const sc = bc._stackChart;
			const dataNew = sc._data.map(function(h) {
				sc._keys.forEach(function(k) {
					const l = d[0];
					if(l !== k) {
						h[k] = 0;
					}
				});
				return h;
			});
			sc.update(dataNew, []);
		}
	}
}

class MutationArray {
    constructor(public array: MutationDatum[]) { }
    groupCountByProperty(propertyName: string) {
        const hist = {};
        this.array.map(function (a) {
            const property = a[propertyName];
            if (property in hist) {
				hist[property]++;
			} else {
				hist[property] = 1;
			}
        });
        return hist;
    }
	
	// code from http://codereview.stackexchange.com/questions/37028/grouping-elements-in-array-by-multiple-properties
	groupByProperties( f ) {
	  const groups = {};
	  this.array.forEach( function( o )
	  {
		const group = JSON.stringify( f(o) );
		groups[group] = groups[group] || [];
		groups[group].push( o );  
	  });
	  return Object.keys(groups).map( function( group )
	  {
		return groups[group]; 
	  });
	}
}

class MutationDatum {
    constructor(public chromosome: string, public end: string, public id: string,
        public mutation: string, public start: string, public type: string) {
    }
}

interface IMutationConverter {
    convert: (data) => MutationArray;
}

interface IMutationDataService {
    getData: (path: string) => any;
}

class JsonDataService implements IMutationDataService {
	getAllData(count : number) {
		const arr = [];
		d3.select('.status').text('loading');
		for(let i = 0; i < count; i++) {
			arr.push($.getJSON(`https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&from=${i}&order=desc`));
			arr[i].then(function (returndata) {
				_alldata = returndata;
				console.log('new data');
			});
		}
		Promise.all(arr).then((values) => {
			console.log('finished');
			d3.select('.status').text('finished');
		});
		
		console.log('loading');
	}
	
    getData(path: string) {
        return $.getJSON(path, function (data, textstatus) {
			return null;
        });
    }
}

class History {
	constructor(keys) {
		for(const k of keys) {
			this[k] = 0;
		}
		this.total = 0;
		this.chrom = '';
	}
	total: number;
	chrom: string;
	obj: IRenderable;
}

document.getElementById('demo').onclick = function() {redraw(_alldata);};

function redraw(data) {
	d3_selection.select('#mutation-ov').select('g').remove();
	d3_selection.select('#chromosome-ov').select('g').remove();
	
	const s: IMutationConverter = {
		convert(data) {
			const convertedArr = data.hits.map(function (datum) {
				return new MutationDatum(datum.chromosome, datum.end, datum.id, datum.mutation, datum.start, datum.type);
			});
			return new MutationArray(convertedArr);
		}
	};
	const mutationArray = s.convert(data);

	const mutations = mutationArray.groupByProperties(function(item)
	{
		return [item.mutation];
	});
	
	let arr = [];
	arr = mutations.map(function(mutation) {
		return mutation.length > 0 ? [mutation[0].mutation, mutation.length] : [];
	});
	
	const keys = arr.map(function(mutation) {
		return mutation[0];
	});
	
	
	const sc = new StackChart();
	const bc = new BarChart();
	bc.update(arr, [keys, sc]);
	
	let chromosomes = mutationArray.groupByProperties(function(item)
	{
	  return [item.chromosome];
	});
	
	
	chromosomes = chromosomes.map(function(ch) {
		
		const hist = new History(keys);
		
		for(const mutationDatum of ch) {
			const m = mutationDatum.mutation;
			if (m in hist) {
				hist[m]++;
			} else { 
				hist[m] = 1;
			}
			hist.chrom = mutationDatum.chromosome;
			hist.total++;
		}
		return hist;
	});
	
	
	sc.update(chromosomes, [keys, bc]);
	
	d3.selectAll('.axis.axis--xbc > g').on('click', function(d, i) {
		arr = [];
		arr.push(d);
		arr.push(i);
		(<any>arr).obj = bc;
		bc.handleClick(arr, i);
	});
	d3.selectAll('.axis.axis--xsc > g').on('click', function(d, i) {
		arr = [];
		arr.push(d);
		arr.push(i);
		(<any>arr).data = sc._data[i];
		sc.selectBar(arr, i);
	});
}

let _alldata = {};

function start1() {
	const obj = new JsonDataService();
	$('.pagination > a:not(.all)').click(function(event){
		event.preventDefault();
		const i = $(this).attr('href');
		$('.pagination > a').removeClass('active');
		$(this).addClass('active');
		const data = obj.getData(`https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&from=${i}&order=desc`).then(
        function (returndata) {
			_alldata = returndata;
            redraw(returndata);
        });
	});
	$('.pagination > a.all').click(function(event) {
		const obj = new JsonDataService();
		event.preventDefault();
		obj.getAllData(3000);
		
	});
	
	obj.getData(`https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&from=1&order=desc`).then(
        function (returndata) {
			_alldata = returndata;
            redraw(returndata);
        });
	
}
