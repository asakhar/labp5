class Edge {
  constructor(p1, p2) {
    this.p1 = p1.copy();
    this.p2 = p2.copy();
  }
  len() {
    return this.p1.copy().sub(this.p2).mag();
  }
  mid() {
    return this.p1.copy().add(this.p2).div(2);
  }
  scale1(val) {
    this.p2.sub(this.p1);
    this.p2.mult(val/this.p2.mag()).add(this.p1);
    return this;
  }
  scale2(val) {
    this.p1.sub(this.p2);
    this.p1.mult(val/this.p1.mag()).add(this.p2);
    return this;
  }
  rotate1(angle) {
    this.p2.sub(this.p1).rotate(angle).add(this.p1);
    return this;
  }
  rotate2(angle) {
    this.p1.sub(this.p2).rotate(angle).add(this.p2);
    return this;
  }
  draw() {
    line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
  }
}