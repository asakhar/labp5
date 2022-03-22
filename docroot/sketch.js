const pentagon = Array(5).fill(108);
const decagon = Array(10).fill(144);
const hexagon = [72, 144, 144, 72, 144, 144];
const bowtie = [72, 72, 216, 72, 72, 216];
const rhombus = [72, 108, 72, 108];

const options = [[rhombus, "#ff000055"], [pentagon, "#00ff0055"], [decagon, "#0000ff55"], [hexagon, "#ff00ff55"], [bowtie, "#00ffff55"]];
const tiles = [];

let displacement;

function setup() {
  displacement = createVector();
  createCanvas(window.innerWidth - 10, window.innerHeight - 20);

  const samples = 
  [
    new Tile(...options[2], createVector(), 50),
    (new Tile(...options[3], createVector(), 30)).rotate(PI / 5, 3),
    (new Tile(...options[4], createVector(), 20)).rotate(6 / 5 * PI),
    (new Tile(...options[4], createVector(), 20)).rotate(6 / 5 * HALF_PI)
  ];

  const getDistVec = function (tile, i, j) {
    return tile.points[i].copy().sub(tile.points[j]);
  };

  const hexoffconst = getDistVec(samples[0], 5, 7).add(getDistVec(samples[1], 3, 4));
  const bowoffconst = getDistVec(samples[0], 7, 0);
  const horoffconst = createVector(getDistVec(samples[0], 0, 5).mag() + getDistVec(samples[1], 0, 3).mag());
  const veroffconst = createVector(0, getDistVec(samples[0], 2, 0).add(getDistVec(samples[1], 2, 3)).y);
  const horperconst = createVector(getDistVec(samples[0], 2, 9).add(getDistVec(samples[1], 2, 3)).x);

  for (let i = -1; i < 9; ++i) {
    const horperoff = horperconst.copy().mult(abs(i) % 2);
    const veroff = veroffconst.copy().mult(i);
    for (let j = -1; j < 5; ++j) {
      const offset = horoffconst.copy().mult(j).add(horperoff).add(veroff);
      tiles.push(samples[0].copy().move(offset));
      tiles.push(samples[1].copy().move(offset.copy().add(hexoffconst)));
      tiles.push(samples[2].copy().move(offset));
      tiles.push(samples[3].copy().move(offset.copy().add(bowoffconst)));
    }
  }
}

function draw() {
  background(255);
  translate(displacement.x, displacement.y);
  tiles.map(tile => tile.draw());
}

function mouseDragged() {
  displacement.add(createVector(mouseX - pmouseX, mouseY - pmouseY));
  return false;
}

function touchMoved() {
  mouseDragged();
  return false;
}