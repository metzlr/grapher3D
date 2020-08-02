
class Graph {
  constructor(xRange, yRange, step, heightFunction) {
    this.heightFunction = heightFunction;
    xRange.sort((a,b) => (a-b));
    yRange.sort((a,b) => (a-b));
    this.range = { x: xRange, y: yRange };
    this.pointsSize = { x: undefined, y: undefined }
    this.step = step;
    this.points = [];
    this.heightMin = undefined;
    this.heightMax = undefined;
    this.generatePoints();
  }
  
  generatePoints() {
    this.pointsSize.x = Math.floor(Math.abs(this.range.x[0] - this.range.x[1])/this.step) + 1, 
    this.pointsSize.y =  Math.floor(Math.abs(this.range.y[0] - this.range.y[1])/this.step) + 1;
    for (let i = 0; i < this.pointsSize.x; i++) {
      for (let j = 0; j < this.pointsSize.y; j++) {
        let x = this.range.x[0] + i * this.step;
        let y = this.range.y[0] + j * this.step;
        let z = this.heightFunction(x,y);
        let p = { x: x, y: y, z: z };
        if (this.heightMin == undefined || p.z < this.heightMin) this.heightMin = p.z;
        if (this.heightMax == undefined || p.z > this.heightMax) this.heightMax = p.z;
        this.points.push(p);
      }
    }
  }

  getPointIndex(x, y) {
    //const sizeY = this.range.y/this.step;
		return (x * this.pointsSize.y + y);
  }
  
  pointExists(index) {
    if (this.points[index].x == Infinity || this.points[index].y == Infinity || this.points[index].z == Infinity) return false;
    return true;
  }
}

export { Graph }


