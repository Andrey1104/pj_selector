export const LOAD_LENGTH_ADD = 150;
export const LOAD_WIDTH_ADD = 150;

export const PROJECTOR_DATA = [
  ["25E", "E20", 379, 14.19333333, -0.066666667, 18950, -1.92, 26],
  ["25s", "M13", 499, 7.848, -0.426666667, 45014, -1.948, 26],
  ["25s", "M20", 490, 14.94, 0.366666667, 17836, -1.911, 26],
  ["25s", "M25", 514, 19.02, 1.166666667, 12929, -1.952, 26],
  ["25s", "M45", 604, 46.74666667, -7.066666667, 1881.7, -1.935, 26],
  ["100s", "M13", 673, 7.848, -0.426666667, 93555, -1.97, 26],
  ["100s", "M9", 395, 4.730769, -0.423077, 200000, -1.97, 26],
  ["100s", "M20", 667, 14.94, 0.366666667, 35995, -1.985, 26],
  ["100s", "M25", 683, 19.02, 1.166666667, 22449, -1.953, 26],
  ["100s", "M45", 810, 46.74666667, -7.066666667, 3443.9, -1.957, 26],
  ["300s", "L13", 1379, 5.072147563, -0.668247694, 157723, -2.006, 44],
  ["300s", "L20", 1379, 6.818445323, -0.3390426, 124712, -2.005, 44],
  ["300s", "L25", 1401, 8.42687747, -0.194993412, 91898, -2.066, 44],
  ["300s", "L30", 1436, 11.9564339, 0.774703557, 37935, -1.925, 44],
  ["300s", "L47", 1549, 18.13561704, 0.435660957, 17235, -1.995, 44]
];

const ProjectorState = {
  height: null,
  realSize: null,
  spotIlluminance: null,
  color: null,
  gap: null,
  triangleSide: null,
  load: null,
  glassSizeRound: null,
  glassSizeTriangle: null,
  customGlassRound: false,
  customGlassTriangle: false,
  zebra: null,
  zebraLength: null,
  zebraWidth: null,
  input: null
};

export class Projector {
  constructor(name, lens, price, angle, glassDistance, lightArea, illuminate, glassSize) {
    this.name = name;
    this.lens = lens;
    this.price = price;
    this.angle = angle;
    this.glassDistance = glassDistance;
    this.lightArea = lightArea;
    this.illuminate = illuminate;
    this.glassSize = glassSize;
    this.liftHeight = null;
    this.resultColor = null;
    this.zebraLength = null;
    this.zebraWidth = null;
  }

  static get state() {
    return ProjectorState;
  }

  static set height(val) { ProjectorState.height = val; }
  static get height() { return ProjectorState.height; }
  
  static set realSize(val) { ProjectorState.realSize = val; }
  static get realSize() { return ProjectorState.realSize; }
  
  static set spotIlluminance(val) { ProjectorState.spotIlluminance = val; }
  static get spotIlluminance() { return ProjectorState.spotIlluminance; }
  
  static set color(val) { ProjectorState.color = val; }
  static get color() { return ProjectorState.color; }
  
  static set gap(val) { ProjectorState.gap = val; }
  static get gap() { return ProjectorState.gap; }
  
  static set triangleSide(val) { ProjectorState.triangleSide = val; }
  static get triangleSide() { return ProjectorState.triangleSide; }
  
  static set load(val) { ProjectorState.load = val; }
  static get load() { return ProjectorState.load; }
  
  static set glassSizeRound(val) { ProjectorState.glassSizeRound = val; }
  static get glassSizeRound() { return ProjectorState.glassSizeRound; }
  
  static set glassSizeTriangle(val) { ProjectorState.glassSizeTriangle = val; }
  static get glassSizeTriangle() { return ProjectorState.glassSizeTriangle; }
  
  static set customGlassRound(val) { ProjectorState.customGlassRound = val; }
  static get customGlassRound() { return ProjectorState.customGlassRound; }
  
  static set customGlassTriangle(val) { ProjectorState.customGlassTriangle = val; }
  static get customGlassTriangle() { return ProjectorState.customGlassTriangle; }
  
  static set zebra(val) { ProjectorState.zebra = val; }
  static get zebra() { return ProjectorState.zebra; }
  
  static set zebraLength(val) { ProjectorState.zebraLength = val; }
  static get zebraLength() { return ProjectorState.zebraLength; }
  
  static set zebraWidth(val) { ProjectorState.zebraWidth = val; }
  static get zebraWidth() { return ProjectorState.zebraWidth; }
  
  static set input(val) { ProjectorState.input = val; }
  static get input() { return ProjectorState.input; }

  toString() {
    return `Name: ${this.name}, Lens: ${this.lens}, Glass size: ${this.glassSize}, Price: ${this.price}`;
  }

  getRealSize(height = null, glassSize = null) {
    const realHeight = height || Projector.height;
    const glass = glassSize || this.glassSize;
    return parseFloat((glass * (this.angle * (realHeight / 1000) + this.glassDistance)).toFixed(0));
  }

  getColors() {
    if (Projector.height) {
      const white = this.lightArea * Math.pow((Projector.height / 1000), this.illuminate);
      const yellow = white * 0.85;
      const blue = white * 0.11;
      const red = white * 0.07;
      const colors = { white, yellow, blue, red };
      for (let key in colors) {
        colors[key] = Math.round(colors[key]);
      }
      return colors;
    }
    return { white: 0, yellow: 0, blue: 0, red: 0 };
  }

  get spotlightBright() {
    if (Projector.color && Projector.spotIlluminance) {
      return this.getColors()[Projector.color];
    }
    return 0;
  }

  getRoundSymbolToGlass() {
    return this.getGlassSymbolSize() <= this.glassSize;
  }

  get triangle() {
    const glassSize = this.getGlassSymbolSize(Projector.triangleSide);
    if (glassSize) {
      const triangleSide = (this.glassSize / 2) * Math.sqrt(3);
      return glassSize < triangleSide ? glassSize : null;
    }
    return null;
  }

  get topLoadHeight() {
    let height = 0;
    if (Projector.load) {
      height = Projector.height - (Projector.load[2] + Projector.load[3]);
    } else {
      height = Projector.height;
    }
    return height;
  }

  getGlassSymbolSize(realSize = null) {
    let height = Projector.height;
    if (Projector.input === "lift") {
      height = this.topLoadHeight;
    }
    
    const radians = this.angle * (height / 1000) + this.glassDistance;
    if (realSize) {
      return parseFloat((realSize / radians).toFixed(1));
    } else if (Projector.realSize) {
      return parseFloat((Projector.realSize / radians).toFixed(1));
    }
    return null;
  }

  getZebraToGlass() {
    return Math.hypot(this.zebraLength, this.zebraWidth) < this.getRealSize();
  }

  getRectangle(rectangle = null) {
    const rect = rectangle || [this.zebraLength, this.zebraWidth];
    return rect.map(size => this.getGlassSymbolSize(size));
  }

  getZebraSizeList(zebra) {
    this.zebraWidth = zebra[1];

    for (let index = 1; index < 1000; index++) {
      this.zebraLength = zebra[0] / index;
      if (Projector.gap) {
        this.zebraLength -= (Projector.gap / index) * (index - 1);
      }
      if (this.getZebraToGlass()) {
        if (this.getRectangle()) {
          return this.getRectangle().concat(index);
        }
      }
    }
    return null;
  }

  getLift(lengthDivider, widthDivider) {
    const loadLength = Projector.load[0] / lengthDivider;
    const loadWidth = Projector.load[1] / widthDivider;
    const diameter = Math.hypot(loadLength, loadWidth);
    return diameter < this.getRealSize(this.topLoadHeight);
  }

  getLiftGlassSize() {
    for (let count = 1; count <= 4; count++) {
      if (count === 3) {
        count += 1;
      }
      if (count === 1) {
        this.liftHeight = Projector.height;
      } else {
        const diameter = this.getRealSize();
        const radius = diameter / 2;
        const side = Math.hypot(Projector.height, radius);
        const bigSide = side * 2;
        this.liftHeight = Math.round(Math.sqrt(Math.pow(bigSide, 2) - Math.pow(diameter, 2)));
      }

      const result = this.getLoadGlassSize(count);
      if (result) {
        return result;
      }
    }
    return null;
  }

  getLoadGlassSize(quantity) {
    let lengthDivider = 1;
    let widthDivider = 1;
    if (quantity === 2) {
      lengthDivider += 1;
    } else if (quantity === 4) {
      lengthDivider += 1;
      widthDivider += 1;
    }
    if (this.getLift(lengthDivider, widthDivider)) {
      let glassSymbol = this.getRectangle([Projector.load[0], Projector.load[1]]);
      const dividers = [lengthDivider, widthDivider];
      glassSymbol = glassSymbol.map((symbol, index) => parseFloat((symbol / dividers[index]).toFixed(1)));
      if (this.glassSize > Math.hypot(glassSymbol[0], glassSymbol[1])) {
        return glassSymbol.concat([parseFloat((this.getRealSize() / 20).toFixed(1)), quantity]);
      }
    }
    return null;
  }
}

export function calculateProjectors(formData) {
  const {
    spotIlluminance,
    height: inputHeight,
    color,
    inputType,
    zebraLength,
    zebraWidth,
    addGap,
    gap,
    realSize,
    customGlassRound,
    glassSizeRound,
    triangleSide,
    customGlassTriangle,
    glassSizeTriangle,
    liftLength,
    liftWidth,
    liftHeight,
    liftCapacity
  } = formData;

  const load = [];
  load.push(parseFloat(liftLength) + LOAD_LENGTH_ADD);
  load.push(parseFloat(liftWidth) + LOAD_WIDTH_ADD);
  load.push(parseFloat(liftHeight));
  load.push(parseFloat(liftCapacity));

  Projector.realSize = parseFloat(realSize);
  Projector.spotIlluminance = parseFloat(spotIlluminance);
  Projector.color = color;
  Projector.gap = addGap ? parseFloat(gap) : null;
  Projector.triangleSide = parseFloat(triangleSide);
  Projector.load = load;
  Projector.glassSizeRound = parseFloat(glassSizeRound);
  Projector.glassSizeTriangle = parseFloat(glassSizeTriangle);
  Projector.customGlassRound = customGlassRound;
  Projector.customGlassTriangle = customGlassTriangle;
  Projector.zebraLength = parseFloat(zebraLength);
  Projector.zebraWidth = parseFloat(zebraWidth);
  Projector.zebra = [parseFloat(zebraLength), parseFloat(zebraWidth)];
  Projector.input = inputType;

  const projectors = PROJECTOR_DATA.map(args => new Projector(...args));

  const results = [];

  projectors.forEach(char => {
    if (char.name.startsWith('3')) {
      Projector.height = inputHeight - 500;
    } else {
      Projector.height = inputHeight - 300;
    }

    let values = {
      projector: char.name,
      lens: char.lens,
      illuminance: Projector.spotIlluminance,
      symbolLux: char.spotlightBright,
      price: char.price,
      symbolSize: '',
      resultColor: 'white'
    };

    const glassSize = char.getGlassSymbolSize();

    if (Projector.customGlassRound) {
      if (Projector.glassSizeRound <= char.glassSize) {
        const size = char.getRealSize(Projector.height, Projector.glassSizeRound);
        values.symbolSize = `~ ${size} mm`;
        values.price = char.price;
        values.resultColor = char.spotlightBright < Projector.spotIlluminance / 2 ? "red" : "white";
      } else {
        return;
      }
    } else if (Projector.customGlassTriangle) {
      const maxGlassSymbolSize = Math.round(char.glassSize * 0.84);
      if (Projector.glassSizeTriangle <= maxGlassSymbolSize) {
        const size = char.getRealSize(Projector.height, Projector.glassSizeTriangle);
        const triangleSideCalc = Math.round((size / 2) * Math.sqrt(3));
        values.symbolSize = `~ 3 * ${triangleSideCalc} mm`;
        values.price = char.price;
        values.resultColor = char.spotlightBright < Projector.spotIlluminance / 2 ? "red" : "white";
      } else {
        return;
      }
    } else if (glassSize && inputType === "round" && Projector.realSize) {
      if (char.getRoundSymbolToGlass()) {
        values.symbolSize = `~ ${glassSize} mm`;
        values.price = char.price;
        values.resultColor = char.spotlightBright < Projector.spotIlluminance / 2 ? "red" : "white";
      } else {
        return;
      }
    } else if (char.triangle && inputType === "triangle" && Projector.triangleSide) {
      values.symbolSize = `~ ${char.triangle} * ${char.triangle} * ${char.triangle} mm`;
      values.price = char.price;
      values.resultColor = char.spotlightBright < Projector.spotIlluminance / 2 ? "red" : "white";
    } else if (Projector.zebra && inputType === "zebra") {
      const size = char.getZebraSizeList(Projector.zebra);
      if (size) {
        values.symbolSize = `${size[2]} PJ * ${size[0]} x ${size[1]} mm`;
        values.price = char.price * size[2];
        values.resultColor = char.spotlightBright < Projector.spotIlluminance / 2 ? "red" : "white";
      } else {
        return;
      }
    } else if (inputType === "lift") {
      const liftResult = char.getLiftGlassSize();
      if (liftResult) {
        let distance = "";
        if (liftResult[3] > 1) {
          distance = `, dist: ${liftResult[2]} cm`;
        }
        values.symbolSize = `${liftResult[3]} * ${liftResult[0]}(l) x ${liftResult[1]}(w) mm${distance}`;
        values.price = char.price * liftResult[3];
        values.resultColor = char.spotlightBright < Projector.spotIlluminance / 2 ? "red" : "white";
      } else {
        return;
      }
    } else {
      return;
    }

    results.push(values);
  });
  results.sort((a, b) => b.symbolLux - a.symbolLux);
  return results;
}

export default Projector;
