var width = 960,
    height = 500,
    padding = 1.5, // separation between same-color circles
    clusterPadding = 6, // separation between different-color circles
    maxRadius = 40;
    minRadius = 10;

var circleInfoArr = [10,20,30,40,20,20,5,2,15,20,25,30];



////// add circles

function addCircles(){

        

        var n = circleInfoArr, // total number of circles
            m = 3; // number of distinct clusters

        color = d3.scale.category10().domain(d3.range(m));
        // The largest node for each cluster.
        clusters = new Array(m);
        var count = 0;
        nodes = d3.range(circleInfoArr.length).map(function() {
            
        var i = Math.floor(circleInfoArr[count] / m),
              r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
              d = {cluster: i, radius: r, id : 'cir_'+count};
          if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;

                  count++;

                  return d;
        });

        force = d3.layout.force()
            .nodes(nodes)
            .size([width, height])
            .gravity(0)
            .charge(0)
            .on("tick", tick)
            .start();

        svg = d3.select("#graphicHolder").append("svg")
            .attr("width", width)
            .attr("height", height);

        circle = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            
            .attr("class","circleGraphic")
            .attr('id', function(d) { return d.id ; } )
            .attr('r', 0)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("fill", "rgb(76,197,222)")
            .call(force.drag);

        circle.transition()
            .duration(1000)
            .attr("r", function(d) { return d.radius; })

}

function tick(e) {

  console.log("TICKER")
  circle
      .each(cluster(10 * e.alpha * e.alpha))
      .each(collide(.5))
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

  
}

// Move d to be adjacent to the cluster node.
function cluster(alpha) {
  return function(d) {
    var cluster = clusters[d.cluster],
        k = 1;

    // For cluster nodes, apply custom gravity.
    if (cluster === d) {
      cluster = {x: width / 2, y: height / 2, radius: -d.radius};
      k = .1 * Math.sqrt(d.radius);
    }

    var x = d.x - cluster.x,
        y = d.y - cluster.y,
        l = Math.sqrt(x * x + y * y),
        r = d.radius + cluster.radius;
    if (l != r) {
      l = (l - r) / l * alpha * k;
      d.x -= x *= l;
      d.y -= y *= l;
      cluster.x += x;
      cluster.y += y;
    }
  };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}


////// end add circles


addCircles()

