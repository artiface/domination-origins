"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const sha1 = require(path.join(basePath, "/node_modules/sha1"));
const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));
const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "/layers");
const {
  format,
  baseUri,
  externalUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
} = require(path.join(basePath, "/src/config.js"));
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var dnaList = new Set();

try {
  const data = fs.readFileSync(path.join(basePath, "/dnalist.json"), 'utf8');
  const asList = JSON.parse(data);
  for (let i = 0; i < asList.length; i++)
  {
    dnaList.add(asList[i]);
  }

} catch (err) {
  console.error(err);
}

const DNA_DELIMITER = "-";

const buildSetup = () => {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }
  if (!fs.existsSync(path.join(buildDir, "/opensea"))) {
    fs.mkdirSync(path.join(buildDir, "/opensea"));
  }
  if (!fs.existsSync(path.join(buildDir, "/images"))) {
    fs.mkdirSync(path.join(buildDir, "/images"));
  }
  if (!fs.existsSync(path.join(buildDir, "/metadata"))) {
    fs.mkdirSync(path.join(buildDir, "/metadata"));
  }
  if (!fs.existsSync(path.join(buildDir, "/thumbs"))) {
    fs.mkdirSync(path.join(buildDir, "/thumbs"));
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  var dna = Number(_str.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    dna: sha1(_dna),
    name: `#${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,
    edition: _edition,
    date: dateTime,
    external_url: `${externalUri}/${_edition}`,
    ...extraMetadata,
    attributes: attributesList,
  };
  metadataList.push(tempMetadata);
  attributesList = [];
};

const replaceBulk = (str, findArray, replaceWith) => {
  var i, regex = [], map = {}; 
  for( i=0; i<findArray.length; i++ ){ 
    regex.push( findArray[i].replace(/([-[\]{}()*+?.\\^$|#,])/g,'\\$1') );
    map[findArray[i]] = replaceWith; 
  }
  regex = regex.join('|');
  str = str.replace( new RegExp( regex, 'g' ), function(matched){
    return map[matched];
  });
  return str;
};

const cleanTrait = (traitName) => {
  const removals = ['ASDFGHJ ', 'BAASDFGHJ ', 'EDCRFB ', 'LKJHGFD ', 'POIUYTR ', 'QAZWSX ', 'QWERTYU ', 'WRAITHFEMALE ', 'WRAITHMALE ', 'ZXCVBN '];
  const cleaned = replaceBulk(traitName, removals, '');
  if (cleaned === 'Constitution') {
    return 'Defense Boost';
  }
  else if (cleaned === 'Wisdom') {
    return 'Speed Boost';
  }
  else if (cleaned === 'Charisma') {
    return 'Power Boost';
  }
  return cleaned;
};

const getDisplayType = (traitName) => {
  if (traitName === 'Level') {
    return 'number';
  }
  else if (traitName == 'Attributes Increase') {
    return 'boost_number';
  }
  else if (traitName.includes('Increase')) {
    return 'boost_percentage';
  }
  return false;
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  const trait = cleanTrait(_element.layer.name);
  const displayType = getDisplayType(trait);
  const value = Number.isInteger(parseInt(selectedElement.name)) ? parseInt(selectedElement.name) : selectedElement.name;
  let attributeData = {
    trait_type: trait,
    value: value,
  };
  if (displayType) {
    attributeData.display_type = displayType;
  }
  attributesList.push(attributeData);
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  return !_DnaList.has(_dna);
};

const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/opensea/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/opensea/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

function chooseLayerConfig(onlyStarter) {
  // index 0-1: normal  - 40%
  // index 2-3: masked  - 30%
  // index 4-5: gold    - 20%
  // index 6-7: warlords
  // index 8-9: angels
  // index 10-11: ghouls
  const percent = Math.ceil(Math.random() * 100);
  
  if (percent < 60 || onlyStarter) {
    return Math.floor(Math.random() * 2);
  }

  if (percent < 70) {
    return Math.floor(Math.random() * 2) + 2;
  }

  if (percent < 80) {
    return Math.floor(Math.random() * 2) + 4;
  }

  if (percent < 90) {
    return Math.floor(Math.random() * 2) + 6;
  }

  if (percent < 95) {
    return Math.floor(Math.random() * 2) + 8;
  }

  return Math.floor(Math.random() * 2) + 10;
}

const startCreating = async (tokenId, onlyStarter) => {
  let layerConfigIndex = 0;
  let failedCount = 0;

  layerConfigIndex = chooseLayerConfig(onlyStarter);
  // choose a layerconfigindex at random
  const layers = layersSetup(
    layerConfigurations[layerConfigIndex].layersOrder
  );

  let newDna = createDna(layers);
  const dnaHash = sha1(newDna);
  if (isDnaUnique(dnaList, dnaHash)) {
    let results = constructLayerToDna(newDna, layers);
    let loadedElements = [];      

    results.forEach((layer) => {
      loadedElements.push(loadLayerImg(layer));
    });

    await Promise.all(loadedElements).then((renderObjectArray) => {
      //debugLogs ? console.log("Clearing canvas") : null;
      ctx.clearRect(0, 0, format.width, format.height);
      if (background.generate) {
        drawBackground();
      }
      renderObjectArray.forEach((renderObject, index) => {
        drawElement(
          renderObject,
          index,
          layerConfigurations[layerConfigIndex].layersOrder.length
        );
      });
      saveImage(tokenId);
      addMetadata(newDna, tokenId);
      saveMetaDataSingleFile(tokenId);
      console.log(
        `${dnaHash}`
      );
    });
    dnaList.add(dnaHash);
    const asList = Array.from(dnaList);
    const dnaAsString = JSON.stringify(asList);
    //console.log("DNA in list: ", asList.length);
    try {
      fs.writeFileSync(path.join(basePath, "/dnalist.json"), dnaAsString);
      // file written successfully
    } catch (err) {
      console.error(err);
    }
  } else {
    //console.log("DNA exists!");
    failedCount++;
    if (failedCount >= uniqueDnaTorrance) {
      console.log(
        `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
      );
      process.exit();
    }
  }  
};

module.exports = { startCreating, buildSetup, getElements };
