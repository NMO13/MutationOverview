class BarChart {
    render(data) {
        let array = [];
        for (var key in data) {
            array.push(data[key]);
            
        }

        d3.select(".chart")
            .selectAll("div")
            .data(array)
            .enter().append("div")
            .style("width", function (d) { return d * 10 + "px"; })
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