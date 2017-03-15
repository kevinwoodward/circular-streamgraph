var file = undefined; //global for selecting local file through buttons
var randAccessor = false;
var prevd = undefined;
var main = (function () {
    if(file == undefined) {
        return; //don't do anything if no dataset selected
    }

    //accessors for csv file
    function stringToNumber(d) {
        d.time = Number(d.time);
        d.value = Number(d.value);
        return d;
    }

    function stringToNumberRand(d) {
        d.time = Number(d.time);
        d.value = Math.random()*1000;
        return d;
    }

    //formatting for dates on axes
    var formatMonth = d3.time.format("%B");
    var formatDay = d3.time.format("%a");

    function month(d) {
        return formatMonth(new Date(2017, d, 1)).substring(0,3);
    }

    function day(d) {
        return formatDay(new Date(2017, 0, d));
    }

    function other(d) {
        if((typeof d) == "number") {
            return d+1;
        }
        return d;
    }

    //dynamically get radii
    var outerRad = document.getElementById("outer").value;
    var innerRad = document.getElementById("inner").value;

    //correct radii if inner > outer
    if(Number(outerRad) <= Number(innerRad)) {
        outerRad = innerRad;
        innerRad -= 10;
        document.getElementById("outer").value = outerRad;
        document.getElementById("inner").value = innerRad;
    }

    //define scaling time values from 0 to 2*pi for smoothness
    var angle = d3.time.scale().range([0, 2*Math.PI]);

    //define scaling difference of radii values linearly
    var rad = d3.scale.linear().range([innerRad, outerRad]);


    //define color scale
    var colorScale = d3.scale.category10();

    //define stacking to be the data with x value of point being time, and y being value
    var stack = d3.layout.stack()
        .values(function (d) {return d.values;})
        .x(function (d) {return d.time;})
        .y(function (d) {return d.value;});

    //define nesting values with key field as key
    var nest = d3.nest().key(function (d) {return d.key;});

    //define interpolating data radially with angle proportional to time, inner radius being min radius value, and outer radius being min value plus y value of data established above
    var area = d3.svg.area.radial()
        .interpolate("cardinal-closed")
        .angle(function (d) {return angle(d.time);})
        .innerRadius(function (d) {return rad(d.y0);})
        .outerRadius(function (d) {return rad(d.y0 + d.y);});

    //dynamically transform svg groups to translate properly in resized svg element
    var svg = d3.select("g").attr("transform",("translate(" + document.getElementById('svgSize').value / 2 + "," + document.getElementById('svgSize').value / 2 + ")"));

    //load csv
    var accessor;
    if(randAccessor) {
        accessor = stringToNumberRand;
    } else {
        accessor = stringToNumber;
    }
    d3.csv(file, accessor, function (data) {
        if(randAccessor && prevd != undefined) {
            data = prevd;
        }
        //border for clarity
        d3.select("svg").attr("style", "outline: solid black;");

        //nest data for stackable displaying
        var layers = stack(nest.entries(data));

        // modify domain to fit properly circularly
        angle.domain([0, d3.max(data, function (d) {return d.time;})]);

        //modify number of axes based on data
        rad.domain([0, d3.max(data, function (d) {return d.y0 + d.y;})]);

        //apply values to layers and set colorscale
        svg.selectAll(".layer")
            .data(layers)
            .enter().append("path")
            .attr("class", "layer")
            .attr("d", function (d) {
                return area(d.values);
            })
            .style("fill", function (d, i) {
                return colorScale(i);
            });

        //create and format axes based on input data
        svg.selectAll(".axis")
            .data(d3.range(angle.domain()[1]))
            .enter().append("g")
            .attr("class", "axis")
            .attr("transform", function (d) {return "rotate("+angle(d)*180/Math.PI+")";})
            .call(d3.svg.axis()
                .scale(rad.copy().range([-innerRad, -outerRad]))
                .orient("right")
                .ticks((outerRad-innerRad)/15)
            )
            .append("text")
            .attr("y", 12 - innerRad)
            .text(function (d) {
                if(svg.selectAll(".axis")[0].length == 7) {
                    return day(d);
                } else if(svg.selectAll(".axis")[0].length == 12) {
                    return month(d);
                } else {
                    return other(d);
                }
            });
        if(randAccessor) {
            prevd = data;
        }
    });

    //remove all children to redraw
    svg.selectAll("*").remove();
});

main();