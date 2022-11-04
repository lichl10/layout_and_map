const width = 800, height = 500;
const svg = d3.select(".chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
    
function switchLayout(visType,projection,simulation) {
    if(visType==="map"){
        simulation.stop();
        svg.selectAll("path")
            .transition()
            .duration(300)
            .attr("opacity",1);
       
        d3.selectAll("circle")
            .transition()
            .attr("cx", function(d){
                d.x = projection([d.longitude, d.latitude])[0];
                return d.x;
            })
            .attr("cy", function(d){
                d.y = projection([d.longitude, d.latitude])[1];
                return d.y;
            });

        svg.selectAll("line")
            .transition().duration(300)
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });
    }else{ 
        simulation.alpha(0.3).restart();
        svg.selectAll("path")
            .transition()
            .duration(300)
            .attr("opacity",0);
        svg.selectAll("circle")
            .transition();
    }
  }


d3.json('airports.json', d3.autoType).then(data => {
    d3.json('world-110m.json').then(wordmap => {
        var visType = d3.selectAll("input[type=radio]:checked").node().value;

        //map
        const features = topojson.feature(wordmap, wordmap.objects.countries);
        const projection = d3.geoMercator()
            .fitExtent([[0, 0], [width, height]], features);
    
        const path = d3.geoPath().projection(projection);
    
        svg.selectAll("path")
            .data(features.features)
            .join("path")
            .attr("d", path)
            .attr("fill", "black");
    
        svg.append("path")
            .datum(topojson.mesh(wordmap, wordmap.objects.countries))
            .attr("d", path)
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr("class", "subunit-boundary");

        if(visType==="force"){
            svg.selectAll("path").attr("opacity",0);
        }
        //force graph
        const rScale = d3.scaleLinear()
            .domain([0, d3.max(data.nodes, d=>d.passengers)])
            .range([0, 10]);

        const simulation = d3.forceSimulation(data.nodes)
            .force("charge", d3.forceManyBody())
            .force("link", d3.forceLink(data.links))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX())
            .force("y", d3.forceY());

        var edges = svg.selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke", "#ccc")
            .style("stroke-width", 1);

        var nodes = svg.selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", d => rScale(d.passengers))
            .attr("fill", "orange")
            .call(drag(simulation));
        

        nodes.append("title")
            .text(d => d.name);
    


        function drag(simulation){
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
                .filter(event => visType === "force");
        }

        simulation.on("tick", function () {
            edges.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            nodes.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        });

        d3.selectAll("input[type=radio]").on("change", event=>{
            visType = event.target.value;// selected button
            switchLayout(visType,projection,simulation);
        });
    });
})