/**
 * Created by Caleydo Team on 31.08.2016.
 */
import * as d3 from 'd3';
import * as d3_scale from 'd3-scale';
import * as d3_axis from 'd3-axis';
import * as d3_selection from 'd3-selection';
import * as d3_shape from 'd3-shape';
import * as $ from 'jquery';
/**
 * The main class for the App app
 */
var App = (function () {
    function App(parent) {
        this.$node = d3_selection.select(parent);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<App>}
     */
    App.prototype.init = function () {
        return this.build();
    };
    /**
     * Load and initialize all necessary views
     * @returns {Promise<App>}
     */
    App.prototype.build = function () {
        this.setBusy(false);
        this.$node.select('h3').remove();
        start1();
        return Promise.resolve(null);
    };
    /**
     * Show or hide the application loading indicator
     * @param isBusy
     */
    App.prototype.setBusy = function (isBusy) {
        this.$node.select('.busy').classed('hidden', !isBusy);
    };
    return App;
}());
export { App };
/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent) {
    return new App(parent);
}
var StackChart = (function () {
    function StackChart() {
        this._clicked = false;
    }
    StackChart.prototype.render = function (data, params) {
        this._keys = params[0] || this._keys;
        this._barChart = params[1] || this._barChart;
        this._data = data || this._data;
        var _this = this;
        data.map(function (h) { h.obj = _this; });
        var svg = d3_selection.select('#chromosome-ov'), margin = { top: 20, right: 20, bottom: 30, left: 40 }, width = +svg.attr('width') - margin.left - margin.right - 30, height = +svg.attr('height') - margin.top - margin.bottom, g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        var x = d3_scale.scaleBand()
            .rangeRound([0, width])
            .paddingInner(0.05)
            .align(0.1);
        var y = d3_scale.scaleLinear()
            .rangeRound([height, 0]);
        x.domain(data.map(function (d) { return d.chrom; }));
        y.domain([0, d3.max(data, function (d) { return d.total; })]).nice();
        var c20 = d3.scale.category20();
        c20.domain(this._keys);
        var layers = d3_shape.stack().keys(this._keys)(data);
        var rects = g.append('g')
            .selectAll('g')
            .data(layers)
            .enter().append('g')
            .attr('fill', function (d) {
            return c20(d.key).toString();
        })
            .selectAll('rect');
        rects.data(function (d) {
            for (var _i = 0, d_1 = d; _i < d_1.length; _i++) {
                var entry = d_1[_i];
                entry.mutation = d.key;
            }
            return d;
        })
            .enter().append('rect')
            .attr('x', function (d) { return x(d.data.chrom).toString(); })
            .attr('y', function (d) { return y(d[1]); })
            .attr('height', function (d) { return y(d[0]) - y(d[1]); })
            .attr('width', x.bandwidth())
            .attr('class', 'barsc')
            .on('click', this.handleClick)
            .append('title')
            .text(function (d) { return d.mutation + ': ' + (d[1] - d[0]).toString(); });
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
        var legend = g.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 10)
            .attr('text-anchor', 'end')
            .selectAll('g')
            .data(layers)
            .enter().append('g')
            .attr('transform', function (d, i) { return 'translate(50,' + i * 20 + ')'; });
        legend.append('rect')
            .attr('x', width - 19)
            .attr('width', 19)
            .attr('height', 13)
            .attr('fill', function (d) {
            return c20(d.key);
        })
            .attr('class', 'legend_label')
            .on('click', this.clickLegend);
        legend.append('text')
            .attr('x', width - 24)
            .attr('y', 9.5)
            .attr('dy', '0.32em')
            .text(function (d) {
            return d.key;
        });
    };
    StackChart.prototype.clickLegend = function (d, i) {
        var sc = d[0].data.obj;
        var obj = [];
        obj.push(d.key);
        obj.push(i);
        obj.obj = sc._barChart;
        sc._barChart.handleClick(obj, i);
    };
    StackChart.prototype.selectBar = function (d, i) {
        var sc = d.data.obj;
        if (!sc._clicked) {
            sc._clicked = true;
            sc.update([d.data], []);
            var newData = [];
            var _loop_1 = function (key) {
                if (d.data[key] > 0) {
                    var el = sc._barChart._data.find(function (x) { return x[0] === key; });
                    newData.push(el);
                }
            };
            for (var _i = 0, _a = sc._keys; _i < _a.length; _i++) {
                var key = _a[_i];
                _loop_1(key);
            }
            sc._barChart.update(newData, []);
        }
    };
    StackChart.prototype.handleClick = function (d, i) {
        var sc = d.data.obj;
        for (var _i = 0, _a = sc._keys; _i < _a.length; _i++) {
            var key = _a[_i];
            if (key !== d.mutation) {
                d.data[key] = 0;
            }
        }
        sc.selectBar(d, i);
    };
    StackChart.prototype.update = function (data, params) {
        var g = d3_selection.select('#chromosome-ov > g');
        g.remove();
        this.render(data, params);
    };
    return StackChart;
}());
var BarChart = (function () {
    function BarChart() {
        this._clicked = false;
        var svg = d3_selection.select('#mutation-ov'), margin = { top: 20, right: 20, bottom: 30, left: 40 };
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
    BarChart.prototype.render = function (data, params) {
        this._keys = params[0] || this._keys;
        this._stackChart = params[1] || this._stackChart;
        var _this = this;
        var keys = this._keys;
        var x = this.x, y = this.y, height = this.height;
        data.forEach(function (x) { return x.obj = _this; });
        x.domain(data.map(function (d) { return d[0]; }));
        y.domain([0, d3.max(data, function (d) { return d[1]; })]);
        this._node.append('g')
            .attr('class', 'axis axis--xbc')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(d3_axis.axisBottom(this.x));
        var c20 = d3.scale.category20();
        c20.domain(this._keys);
        // if we have selected anything, update it
        if (this._data !== undefined) {
            d3.selectAll('.barbc').data(data, function (d) {
                return d[0];
            }).exit()
                .transition()
                .duration(3000)
                .attr('height', 0)
                .attr('y', function (d) { return height; })
                .remove();
        }
        else {
            var bars = this._node.selectAll('.barbc')
                .data(data, function (d) {
                return d[0];
            });
            bars.enter().append('rect')
                .attr('class', 'barbc')
                .attr('x', function (d) { return x(d[0]); })
                .attr('y', function (d) { return y(d[1]); })
                .attr('width', x.bandwidth())
                .attr('height', function (d) {
                return height - y(d[1]);
            })
                .attr('fill', function (d) {
                return c20(keys.find(function (x) { return d[0] === x; }));
            })
                .on('click', this.handleClick);
            bars.append('title')
                .text(function (d) { return d[0] + ' - ' + d[1]; });
            this._data = data;
        }
    };
    BarChart.prototype.update = function (data, params) {
        //let g = d3_selection.select("#mutation-ov > g");
        //g.remove();
        this.render(data, params);
    };
    BarChart.prototype.handleClick = function (d, i) {
        var bc = d.obj;
        if (!bc._clicked) {
            bc._clicked = true;
            var key = bc._keys[i];
            bc.update([d], []);
            var sc_1 = bc._stackChart;
            var dataNew = sc_1._data.map(function (h) {
                sc_1._keys.forEach(function (k) {
                    var l = d[0];
                    if (l !== k) {
                        h[k] = 0;
                    }
                });
                return h;
            });
            sc_1.update(dataNew, []);
        }
    };
    return BarChart;
}());
var MutationArray = (function () {
    function MutationArray(array) {
        this.array = array;
    }
    MutationArray.prototype.groupCountByProperty = function (propertyName) {
        var hist = {};
        this.array.map(function (a) {
            var property = a[propertyName];
            if (property in hist) {
                hist[property]++;
            }
            else {
                hist[property] = 1;
            }
        });
        return hist;
    };
    // code from http://codereview.stackexchange.com/questions/37028/grouping-elements-in-array-by-multiple-properties
    MutationArray.prototype.groupByProperties = function (f) {
        var groups = {};
        this.array.forEach(function (o) {
            var group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(function (group) {
            return groups[group];
        });
    };
    return MutationArray;
}());
var MutationDatum = (function () {
    function MutationDatum(chromosome, end, id, mutation, start, type) {
        this.chromosome = chromosome;
        this.end = end;
        this.id = id;
        this.mutation = mutation;
        this.start = start;
        this.type = type;
    }
    return MutationDatum;
}());
var JsonDataService = (function () {
    function JsonDataService() {
    }
    JsonDataService.prototype.getAllData = function (count) {
        var arr = [];
        d3.select('.status').text('loading');
        for (var i = 0; i < count; i++) {
            arr.push($.getJSON("https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&from=" + i + "&order=desc"));
            arr[i].then(function (returndata) {
                _alldata = returndata;
                console.log('new data');
            });
        }
        Promise.all(arr).then(function (values) {
            console.log('finished');
            d3.select('.status').text('finished');
        });
        console.log('loading');
    };
    JsonDataService.prototype.getData = function (path) {
        return $.getJSON(path, function (data, textstatus) {
            return null;
        });
    };
    return JsonDataService;
}());
var History = (function () {
    function History(keys) {
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            this[k] = 0;
        }
        this.total = 0;
        this.chrom = '';
    }
    return History;
}());
document.getElementById('demo').onclick = function () { redraw(_alldata); };
function redraw(data) {
    d3_selection.select('#mutation-ov').select('g').remove();
    d3_selection.select('#chromosome-ov').select('g').remove();
    var s = {
        convert: function (data) {
            var convertedArr = data.hits.map(function (datum) {
                return new MutationDatum(datum.chromosome, datum.end, datum.id, datum.mutation, datum.start, datum.type);
            });
            return new MutationArray(convertedArr);
        }
    };
    var mutationArray = s.convert(data);
    var mutations = mutationArray.groupByProperties(function (item) {
        return [item.mutation];
    });
    var arr = [];
    arr = mutations.map(function (mutation) {
        return mutation.length > 0 ? [mutation[0].mutation, mutation.length] : [];
    });
    var keys = arr.map(function (mutation) {
        return mutation[0];
    });
    var sc = new StackChart();
    var bc = new BarChart();
    bc.update(arr, [keys, sc]);
    var chromosomes = mutationArray.groupByProperties(function (item) {
        return [item.chromosome];
    });
    chromosomes = chromosomes.map(function (ch) {
        var hist = new History(keys);
        for (var _i = 0, ch_1 = ch; _i < ch_1.length; _i++) {
            var mutationDatum = ch_1[_i];
            var m = mutationDatum.mutation;
            if (m in hist) {
                hist[m]++;
            }
            else {
                hist[m] = 1;
            }
            hist.chrom = mutationDatum.chromosome;
            hist.total++;
        }
        return hist;
    });
    sc.update(chromosomes, [keys, bc]);
    d3.selectAll('.axis.axis--xbc > g').on('click', function (d, i) {
        arr = [];
        arr.push(d);
        arr.push(i);
        arr.obj = bc;
        bc.handleClick(arr, i);
    });
    d3.selectAll('.axis.axis--xsc > g').on('click', function (d, i) {
        arr = [];
        arr.push(d);
        arr.push(i);
        arr.data = sc._data[i];
        sc.selectBar(arr, i);
    });
}
var _alldata = {};
function start1() {
    var obj = new JsonDataService();
    $('.pagination > a:not(.all)').click(function (event) {
        event.preventDefault();
        var i = $(this).attr('href');
        $('.pagination > a').removeClass('active');
        $(this).addClass('active');
        var data = obj.getData("https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&from=" + i + "&order=desc").then(function (returndata) {
            _alldata = returndata;
            redraw(returndata);
        });
    });
    $('.pagination > a.all').click(function (event) {
        var obj = new JsonDataService();
        event.preventDefault();
        obj.getAllData(3000);
    });
    obj.getData("https://dcc.icgc.org/api/v1/projects/GBM-US/mutations?field=id,mutation,type,chromosome,start,end&size=100&from=1&order=desc").then(function (returndata) {
        _alldata = returndata;
        redraw(returndata);
    });
}
//# sourceMappingURL=app.js.map