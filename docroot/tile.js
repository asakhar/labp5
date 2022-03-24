/**
 * @class Класс для хранения вершин тайла, а так же цвета, длины внутренних girih
 */
class Tile {
  constructor(angles = [], color = "#000000", position = createVector(), dashlen = 25, angleMode = DEGREES) {
    this.angles = angles.map(a => a);
    this.color = color;
    this.points = [];
    this.dashlen = dashlen;
    const point = position;
    let angle = 0;
    for (let a of this.angles) {
      this.points.push(point.copy());
      angle += PI - a * (angleMode == DEGREES ? TWO_PI / 360 : 1);
      const vel = createVector(50, 0);
      vel.rotate(angle);
      point.add(vel);
    }
  }
  /**
   * Скопировать все вершины, цвет и длину girih
   * @returns {Tile} Копию тайла
   */
  copy() {
    const t = new Tile();
    t.angles = this.angles.copy();
    t.color = this.color;
    t.points = this.points.deep_copy();
    t.dashlen = this.dashlen;
    return t;
  }
  /**
   * Отрисовка
   */
  draw() {
    push();
    fill(this.color);
    strokeWeight(0);
    beginShape();
    this.points.map(point => vertex(point.x, point.y));
    endShape(CLOSE);
    pop();

    for (let i = 0; i < this.points.length; ++i) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      const middle = p1.copy().add(p2).div(2);
      const first = new Edge(middle, p1);
      const second = new Edge(middle, p2);
      first.rotate1(-3 * HALF_PI / 5).scale1(this.dashlen);
      second.rotate1(3 * HALF_PI / 5).scale1(this.dashlen);
      strokeWeight(3);
      first.draw();
      second.draw();
    }
  }
  /**
   * @param {Tile} poly
   * @returns {boolean} do polygons overlap
   */
  overlaps(poly) {
    for (let pt of this.points) {
      if (inside(pt, poly.points))
        return true;
    }
    return false;
  }
  /**
   * Повернуть тайл вокруг вершины `idx` на `angle` градусов/радиан в зависомости от `angleMode`
   * @param {number} angle угол
   * @param {integer} idx индекс вершины
   * @param {RADIANS|DEGREES} angleMode режим измерения угла
   * @returns {Tile} возвращает ссылку на этот же тайл для возможности цепного вызова подобных функций
   * @example 
   * tile.rotate(PI/2).move(createVector(50, 30));
   */
  rotate(angle, idx = 0, angleMode = RADIANS) {
    const basis = this.points[idx].copy();
    const mult = angleMode == DEGREES ? 360 / TWO_PI : 1;
    this.points = this.points.map(a => a.sub(basis).rotate(angle * mult).add(basis));
    return this;
  }
  /**
   * переместить тайл относительно текущей позиции на `offset`
   * @param {p5.Vector} offset вектор смещения
   * @returns {Tile}
   */
  move(offset) {
    this.points.map(pt => pt.add(offset));
    return this;
  }

  /**
   * переместить тайл абсолютно, установив вершину с индексом `idx` в точку `pos`
   * @param {p5.Vector} pos смещение
   * @param {integer} idx индекс вершины
   * @returns {Tile}
   */
  setpos(pos, idx = 0) {
    const basis = this.points[idx].copy();
    this.points = this.points.map(a => a.sub(basis).add(offset));
    return this;
  }
}