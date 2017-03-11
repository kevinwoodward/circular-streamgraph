var call = (function enclosed() {

    var formatMonth = d3.time.format("%m"),
        month = function (d) {
            return formatMonth(new Date(2017, d, 1));
        };

    var formatDay = d3.time.format("%a"),
        day = function (d) {
            return formatDay(new Date(2017, 0, d));
        };

    var outerRadius = document.getElementById("outer").value;
    var innerRadius = document.getElementById("inner").value;

    if(outerRadius <= innerRadius) {
        outerRadius = innerRadius;
        innerRadius -= 10;
        document.getElementById("outer").value = outerRadius;
        document.getElementById("inner").value = innerRadius;
    }

    var angle = d3.time.scale()
        .range([0, 2 * Math.PI]);

    var radius = d3.scale.linear()
        .range([innerRadius, outerRadius]);

    var colorScale = d3.scale.category10();

    var stack = d3.layout.stack()
        .values(function (d) {
            return d.values;
        })
        .x(function (d) {
            return d.time;
        })
        .y(function (d) {
            return d.value;
        });

    var nest = d3.nest()
        .key(function (d) {
            return d.key;
        });

    var line = d3.svg.line.radial()
        .interpolate("cardinal-closed")
        .angle(function (d) {
            return angle(d.time);
        })
        .radius(function (d) {
            return radius(d.y0 + d.y);
        });

    var area = d3.svg.area.radial()
        .interpolate("cardinal-closed")
        .angle(function (d) {
            return angle(d.time);
        })
        .innerRadius(function (d) {
            return radius(d.y0);
        })
        .outerRadius(function (d) {
            return radius(d.y0 + d.y);
        });

    var svg = d3.select("g");

    d3.csv(document.getElementById("fileID").value, type, function (error, data) {
        if (error) throw error;

        var layers = stack(nest.entries(data));

        // Extend the domain slightly to match the range of [0, 2π].
        angle.domain([0, d3.max(data, function (d) {
            return d.time;
        })]); //TODO: modify this for modular # of spokes.
        radius.domain([0, d3.max(data, function (d) {
            return d.y0 + d.y;
        })]);

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

        svg.selectAll(".axis")
            .data(d3.range(angle.domain()[1]))
            .enter().append("g")
            .attr("class", "axis")
            .attr("transform", function (d) {
                return "rotate(" + angle(d) * 180 / Math.PI + ")";
            })
            .call(d3.svg.axis()
                .scale(radius.copy().range([-innerRadius, -outerRadius]))
                .orient("right"))
            .append("text")
            .attr("y", -innerRadius + 3)
            .attr("dy", ".70em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return day(d);
            });
    });

    function type(d) {
        d.time = +d.time;
        d.value = +d.value;
        return d;
    }
    svg.selectAll("*").remove();
});

call();