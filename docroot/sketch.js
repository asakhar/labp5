// описание внутренних углов тайлов 
const pentagon = Array(5).fill(108);
const decagon = Array(10).fill(144);
const hexagon = [72, 144, 144, 72, 144, 144];
const bowtie = [72, 72, 216, 72, 72, 216];
const rhombus = [72, 108, 72, 108];

// каждому тайлу сопоставляем цвет
const options = [[rhombus, "#ff000055"], [pentagon, "#00ff0055"], [decagon, "#0000ff55"], [hexagon, "#ff00ff55"], [bowtie, "#00ffff55"]];

// массив сгенерированных тайлов
const tiles = [];

// смещение от изначального положения (для возможности перетаскивания отображаемой области области)
let displacement;

function setup() {
  displacement = createVector();
  // создаем холст
  createCanvas(window.innerWidth - 10, window.innerHeight - 20);

  // шаблоны тайлов для расположения на холсте
  const samples = 
  [
    new Tile(...options[2], createVector(), 50),
    (new Tile(...options[3], createVector(), 30)).rotate(PI / 5, 3),
    (new Tile(...options[4], createVector(), 20)).rotate(6 / 5 * PI),
    (new Tile(...options[4], createVector(), 20)).rotate(6 / 5 * HALF_PI)
  ];

  // константы смещения
  // для вытянутого гексагона
  const hexoffconst = getDistVec(samples[0], 5, 7).add(getDistVec(samples[1], 3, 4));
  // для "бабочки"
  const bowoffconst = getDistVec(samples[0], 7, 0);
  // горизонтальное смещение тайлов
  const horoffconst = createVector(getDistVec(samples[0], 0, 5).mag() + getDistVec(samples[1], 0, 3).mag());
  // вертикальное
  const veroffconst = createVector(0, getDistVec(samples[0], 2, 0).add(getDistVec(samples[1], 2, 3)).y);
  // переодическое смещение (каждую вторую строку)
  const horperconst = createVector(getDistVec(samples[0], 2, 9).add(getDistVec(samples[1], 2, 3)).x);

  for (let i = -1; i < 9; ++i) {
    // будет ли смещение вправо в данной строке
    const horperoff = horperconst.copy().mult(abs(i) % 2);
    // вертикальное смещение слоя i
    const veroff = veroffconst.copy().mult(i);
    // повторяем, чтобы сделать паттерн
    for (let j = -1; j < 9; ++j) {
      // горизонтальное смещение колонки j
      const offset = horoffconst.copy().mult(j).add(horperoff).add(veroff);
      // обавляем декагон
      tiles.push(samples[0].copy().move(offset));
      // гексагон
      tiles.push(samples[1].copy().move(offset.copy().add(hexoffconst)));
      // и 2 "бабочки"
      tiles.push(samples[2].copy().move(offset));
      tiles.push(samples[3].copy().move(offset.copy().add(bowoffconst)));
    }
  }
}

function draw() {
  background(255);
  // смещаемся на текущее смещение по координатам
  translate(displacement.x, displacement.y);
  // для каждого объекта из tiles вызываем метод draw (отрисовка)
  tiles.map(tile => tile.draw());
}

function mouseDragged() {
  // добавить смещение при перетаскивании мышкой
  displacement.add(createVector(mouseX - pmouseX, mouseY - pmouseY));
  return false;
}

function touchMoved() {
  // тоже перетаскивание, но для мобильных устройств (тачскринов)
  mouseDragged();
  return false;
}