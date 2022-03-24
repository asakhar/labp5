/**
 * @class Класс для хранения вершин ребра
 */
class Edge {
  /**
   * Конструктор
   * @param {p5.Vector} p1 вершина 1
   * @param {p5.Vector} p2 вершина 2
   */
  constructor(p1, p2) {
    this.p1 = p1.copy();
    this.p2 = p2.copy();
  }
  /**
   * Получить длину ребра
   * @returns {number}
   */
  len() {
    return this.p1.copy().sub(this.p2).mag();
  }
  /**
   * Получить середину ребра
   * @returns {p5.Vector}
   */
  mid() {
    return this.p1.copy().add(this.p2).div(2);
  }
  /**
   * Удлинить ребро от первой точки
   * @param {number} val множитель
   * @returns {Edge}
   */
  scale1(val) {
    this.p2.sub(this.p1);
    this.p2.mult(val/this.p2.mag()).add(this.p1);
    return this;
  }
  /**
   * Удлинить ребро от второй точки
   * @param {number} val множитель
   * @returns {Edge}
   */
  scale2(val) {
    this.p1.sub(this.p2);
    this.p1.mult(val/this.p1.mag()).add(this.p2);
    return this;
  }
  /**
   * Повернуть ребро относительно первой вершины на `angle` в радианах
   * @param {number} angle Угол
   * @returns {Edge}
   */
  rotate1(angle) {
    this.p2.sub(this.p1).rotate(angle).add(this.p1);
    return this;
  }
  /**
   * Повернуть ребро относительно второй вершины на `angle` в радианах
   * @param {number} angle Угол
   * @returns {Edge}
   */
  rotate2(angle) {
    this.p1.sub(this.p2).rotate(angle).add(this.p2);
    return this;
  }
  /**
   * Отрисовка
   */
  draw() {
    line(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
  }
}