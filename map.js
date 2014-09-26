(function(){
    console.log("Hello there! I hope you like my resume!");
    var canvas = document.getElementById('hexmap');
 
    var hexHeight,
        hexRadius,
        hexRectangleHeight,
        hexRectangleWidth,
        hexagonAngle = 30 * Math.PI / 180,
        sideLength = 8,
        boardWidth = 110, boardHeight = 110;
       
    hexHeight = Math.sin(hexagonAngle) * sideLength;
    hexRadius = Math.cos(hexagonAngle) * sideLength;
    hexRectangleHeight = sideLength + 2 * hexHeight;
    hexRectangleWidth = 2 * hexRadius;
    
    
    // heightmap generator
    function randint(i){
        return Math.round(Math.random() * i);
    }
    function arrayMax(arr){
        return Math.max.apply(null, arr);
    }
    function HeightMap(size) {
        // prepare the grid
        this.grid = [];
        this.size = size;
        var x, y;
        for(y = 0; y < size; y++){
            this.grid[y] = [];
            for(x = 0; x < size; x++){
                this.grid[y][x] = 0;
            }
        }
        this.grid[0][0] = randint(255);
        this.grid[size-1][0] = randint(255);
        this.grid[0][size-1] = randint(255);
        this.grid[size-1][size-1] = randint(255);
        this.count = 0;
        this.subdivide(0, 0, size-1, size-1);
        
        var avg = [];
        var m = [];
        this.grid.forEach(function (row){
            var num = 0;
            m.push(arrayMax(row));
            row.forEach(function (col) {
                num += col;
            });
            avg.push(num / row.length);
        });
        this.max_height = Math.round(arrayMax(m));
        this.avg_height = Math.round(avg.reduce(function(a, b) {
            return a + b;
        }) / avg.length);
    }
    HeightMap.prototype.adjust = function (xa, ya, x, y, xb, yb){
        if (this.grid[x][y] === 0){
            var d = Math.abs(xa - xb) + Math.abs(ya - yb),
                v = (this.grid[xa][ya] + this.grid[xb][yb]) / 2,
                roughness = 3.6;
            v += (Math.random() - 0.5) * d * roughness;
            var c = Math.abs(v) % 257;
            if (y === 0){
                this.grid[x][this.size-1] = c;
            }
            if ( (x === 0 || x === this.size-1) && y < this.size-1){
                this.grid[x][this.size-1 -y] = c;
            }
            if (c < 0) {
                c = 0;
            } else if (c > 255){
                c = 255;
            }
            this.grid[x][y] = c;
        }
    }
    HeightMap.prototype.subdivide = function (x1, y1, x2, y2){
        if (!( x2-x1 < 2 &&  y2-y1 < 2 )) {
            var x = Math.floor((x1 + x2) / 2),
                y = Math.floor((y1 + y2) / 2),
                v = Math.floor( (this.grid[x1][y1] + this.grid[x2][y1] + this.grid[x2][y2] + this.grid[x1][y2]) / 4);
            if (v < 0){
                v = 0;
            } else if (v > 255){
                v = 255;
            }
            this.grid[x][y] = v;
            this.adjust(x1, y1, x, y1, x2, y1);
            this.adjust(x2, y1, x2, y, x2, y2);
            this.adjust(x1, y2, x, y2, x2, y2);
            this.adjust(x1, y1, x1, y, x1, y2);
            
            this.count++;
            this.subdivide(x1, y1, x, y)
            this.subdivide(x, y1, x2, y)
            this.subdivide(x, y, x2, y2)
            this.subdivide(x1, y, x, y2)
        }
    }
    var heightmap = new HeightMap(boardWidth),
        grid = heightmap.grid;
    var sealevel = heightmap.avg_height,
        maxheight = heightmap.max_height;
 
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
 
        //ctx.fillStyle = "#000";
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 0.2;
 
        drawBoard(ctx, boardWidth, boardHeight);
    }
 
    function drawBoard(canvasContext, width, height) {
        var i,
            j;
 
        for(i = 0; i < width; ++i) {
            for(j = 0; j < height; ++j) {
                drawHexagon(
                    ctx, 
                    i * hexRectangleWidth + ((j % 2) * hexRadius), 
                    j * (sideLength + hexHeight), 
                    false,
                    j,
                    i
                );
            }
        }
    }
    
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    function greyHex(c){
        var h = componentToHex(c);
        return "#"+h+h+h;
    }
 
    function drawHexagon(canvasContext, x, y, fill, cx, cy) {           
        var fill = fill || false;
        
        canvasContext.lineWidth = 0;
        canvasContext.beginPath();
        canvasContext.moveTo(x + hexRadius, y);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight + sideLength);
        canvasContext.lineTo(x + hexRadius, y + hexRectangleHeight);
        canvasContext.lineTo(x, y + sideLength + hexHeight);
        canvasContext.lineTo(x, y + hexHeight);
        canvasContext.closePath();
        
         
        if(fill) {
            canvasContext.fill();
        } else {
            var level = grid[cx][cy];
            var land_low = [81, 115, 99];
            var land_high = [225, 219, 185];
            var water_low = [41, 92, 143];
            var water_high = [100, 152, 203];
            var ratio;
            if (level > sealevel) { // land
                var r_diff = Math.abs(land_low[0] - land_high[0]),
                    g_diff = Math.abs(land_low[1] - land_high[1]),
                    b_diff = Math.abs(land_low[2] - land_high[2]);
                ratio = 1 * (level - sealevel) / (255 - sealevel);
                var r = Math.min(Math.round(land_low[0] + (r_diff * ratio)), 255),
                    g = Math.min(Math.round(land_low[1] + (g_diff * ratio)), 255),
                    b = Math.min(Math.round(land_low[2] + (b_diff * ratio)), 255);
                canvasContext.fillStyle = "rgb("+r+","+g+","+b+")";
            } else { // water
                var r_diff = Math.abs(water_low[0] - water_high[0]),
                    g_diff = Math.abs(water_low[1] - water_high[1]),
                    b_diff = Math.abs(water_low[2] - water_high[2]);
                ratio = 1 * level / sealevel;
                var r = Math.min(Math.round(water_low[0] + (r_diff * ratio)), 255),
                    g = Math.min(Math.round(water_low[1] + (r_diff * ratio)), 255),
                    b = Math.min(Math.round(water_low[2] + (r_diff * ratio)), 255);
                canvasContext.fillStyle = "rgb("+r+","+g+","+b+")";
            }
            canvasContext.fill();
            canvasContext.stroke();
        }
    }
 
})();