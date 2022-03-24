/**
 * @param {p5.Vector} point
 * @param {Array<p5.Vector>} vs
 * @returns {boolean} is a point inside polygon
 */
function inside(point, vs) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

  const x = point.x, y = point.y;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;

    const intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

// Warn if overriding existing method
if (Array.prototype.equals)
  console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;

  // compare lengths - can save a lot of time 
  if (this.length != array.length)
    return false;

  for (let i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    }
    else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

/**
 * @param {Array} items
 * @returns {any} randomly sampled item from array
 */
function sample(items) {
  return items[floor(random() * items.length)];
}

// Warn if overriding existing method
if (Array.prototype.copy)
  console.warn("Overriding existing Array.prototype.copy. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .copy method to Array's prototype to call it on any array
Array.prototype.copy = function () {
  return this.map(a => a);
}

// Warn if overriding existing method
if (Array.prototype.deep_copy)
  console.warn("Overriding existing Array.prototype.deep_copy. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .deep_copy method to Array's prototype to call it on any array
Array.prototype.deep_copy = function () {
  return this.map(a => {
    if (a.deep_copy) {
      return a.deep_copy();
    }
    if (a.copy) {
      return a.copy();
    }
    return a;
  });
}

/**
 * Returns `-1` on `val`ues less than `0` and `1` else
 * @param {number} val 
 * @returns 
 */
function sign(val) {
  if (val < 0)
    return -1;
  return 1;
}

/**
 * Получить расстояние между вершинами тайла
 * @param {Tile} tile тайл
 * @param {integer} i первая вершина
 * @param {integer} j вторая вершина
 * @returns {integer} расстояние между вершинами тайла
 */
function getDistVec(tile, i, j) {
  return tile.points[i].copy().sub(tile.points[j]);
};