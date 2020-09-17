import { Parser } from "expr-eval";

class GraphPlotter3D {
  constructor(functionString, range, step) {
    this.step = step;
    this.range = {
      x: [range.x.min, range.x.max],
      y: [range.y.min, range.y.max],
      z: [range.z.min, range.z.max],
    };
    this.mathParser = new Parser({
      operators: {
        remainder: false,
        concatenate: false,
        conditional: false,
        logical: false,
        comparison: false,
        assignment: false,
        random: false,
        array: false,
        fndef: false,
      },
    });
    this.heightFunction = this._parseFunctionString(functionString);
    this.range.x.sort((a, b) => a - b);
    this.range.y.sort((a, b) => a - b);
    this.range.z.sort((a, b) => a - b);
    this.gridSize = { x: undefined, y: undefined };
    this.heightMin, (this.heightMax = undefined);
    this.points = [];
    this._generatePoints();
  }

  _parseFunctionString(str) {
    let expr = this.mathParser.parse(str);
    let vars = expr.variables().sort();
    if (vars.length > 2) {
      throw Error("Too many variables in function");
    }
    for (let i = 0; i < vars.length; i++) {
      if (vars[i] !== "x" && vars[i] !== "y") {
        throw Error(
          'Unknown variables in function. Please only use "x" and "y"'
        );
      }
    }
    let func = expr.toJSFunction("x,y");
    return func;
  }

  _generatePoints() {
    (this.gridSize.x =
      Math.floor(Math.abs(this.range.x[0] - this.range.x[1]) / this.step) + 1),
      (this.gridSize.y =
        Math.floor(Math.abs(this.range.y[0] - this.range.y[1]) / this.step) +
        1);
    for (let i = 0; i < this.gridSize.x; i++) {
      for (let j = 0; j < this.gridSize.y; j++) {
        let x = this.range.x[0] + i * this.step;
        let y = this.range.y[0] + j * this.step;
        let z = this.heightFunction(x, y);
        // Ensure z is within defined bounds
        z = Math.max(this.range.z[0], z);
        z = Math.min(this.range.z[1], z);
        let p = { x: x, y: y, z: z };
        if (this.heightMin == undefined || p.z < this.heightMin)
          this.heightMin = p.z;
        if (this.heightMax == undefined || p.z > this.heightMax)
          this.heightMax = p.z;
        this.points.push(p);
      }
    }
  }

  getGridIndex(x, y) {
    //const sizeY = this.range.y/this.step;
    return x * this.gridSize.y + y;
  }

  // pointExists(index) {
  //   if (this.points[index].x == Infinity || this.points[index].y == Infinity || this.points[index].z == Infinity) return false;
  //   return true;
  // }
}

export { GraphPlotter3D };
