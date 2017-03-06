class BarChart {
    render(data) {
        let width = 960,
            height = 500;
        let array = [];
        for (var key in data) {
            array.push(data[key]);           
        }

        var y = d3.scale.linear()
            .range([height, 0]);

        var margin = { top: 20, right: 30, bottom: 30, left: 40 },
            width1 = width - margin.left - margin.right,
            height1 = height - margin.top - margin.bottom;

        var chart = d3.select(".chart")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        y.domain([0, d3.max(array, function (d) { return d; })]);
        let barWidth = width / array.length;

        var bar = chart.selectAll("g")
            .data(array)
            .enter().append("g")
            .attr("transform", function (d, i) { return "translate(" + i * barWidth + ", 0)"; });

        bar.append("rect")
            .attr("y", function (d) { return y(d); })
            .attr("height", function (d) { return height - y(d); })
            .attr("width", barWidth - 1);

        bar.append("text")
            .attr("x", barWidth / 2)
            .attr("y", function (d) { return y(d) + 3; })
            .attr("dy", ".75em")
            .text(function (d) { return d; });

        
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


            let bc = new BarChart();
            bc.render(mutationArray.groupCountByProperty("mutation"));
        });   
}

window.onload = () => {
    var el = document.getElementById('content');
    start1();    
};