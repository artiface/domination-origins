"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "constants/blend_mode.js"));
const description = "G4N9 Troop";
const baseUri = "https://staging.32kb.org/images";
const externalUri = "https://staging.32kb.org/troops/2";

const layerConfigurations = [
  {
    /// normal
    // male
    growEditionSizeTo: 3729,
    layersOrder: [
      { name: "ZXCVBN Sex" },
      { name: "ZXCVBN Origin" },
      { name: "Background" },
      { name: "Background Pattern" },
      { name: "Back Gear" },
      { name: "ZXCVBN Body" },
      { name: "ZXCVBN Eyes" },
      { name: "ZXCVBN Tatoo" },
      { name: "ZXCVBN Facial Features" },
      { name: "ZXCVBN Facial Wear" },
      { name: "ZXCVBN Hair" },
      { name: "ZXCVBN Eye Wear" },
      { name: "Shirt" },
      { name: "ZXCVBN Clothes" },
      { name: "ZXCVBN Ear Wear" },
      { name: "Effect" },
      //levels
      { name: "Level" },
      { name: "Strength" },
      { name: "Dexterity" },
      { name: "Constitution" },
      { name: "Intelligence" },
      { name: "Agility" },
      { name: "Wisdom" },
      { name: "Charisma" },
    ],
  },
  /// normal
  // female
  {
    growEditionSizeTo: 7000,
    layersOrder: [
      { name: "QWERTYU Sex" },
      { name: "QWERTYU Origin" },
      { name: "Background" },
      { name: "Background Pattern" },
      { name: "Back Gear" },
      { name: "QWERTYU Body" },
      { name: "QWERTYU Eyes" },
      { name: "QWERTYU Tatoo" },
      { name: "Makeup" },
      { name: "QWERTYU Facial Features" },
      { name: "QWERTYU Facial Wear" },
      { name: "QWERTYU Hair" },
      { name: "QWERTYU Eye Wear" },
      { name: "QWERTYU Clothes" },
      { name: "QWERTYU Ear Wear" },
      { name: "Effect" },
      //levels
      { name: "Level" },
      { name: "Strength" },
      { name: "Dexterity" },
      { name: "Constitution" },
      { name: "Intelligence" },
      { name: "Agility" },
      { name: "Wisdom" },
      { name: "Charisma" },
    ],
  },
  ////Masked
  ///Male
  {
    growEditionSizeTo: 7923,
    layersOrder: [
      { name: "ZXCVBN Sex" },
      { name: "ZXCVBN Origin" },
      { name: "Background" },
      { name: "Background Pattern" },
      { name: "Back Gear" },
      { name: "ZXCVBN Body" },
      { name: "ZXCVBN Eyes" },
      { name: "ZXCVBN Tatoo" },
      { name: "ZXCVBN Masked" },
      { name: "ZXCVBN Hair" },
      { name: "Shirt" },
      { name: "ZXCVBN Clothes" },
      { name: "ZXCVBN Ear Wear" },
      { name: "Effect" },
      //levels
      { name: "EDCRFB Level" },
      { name: "EDCRFB Strength" },
      { name: "EDCRFB Dexterity" },
      { name: "EDCRFB Constitution" },
      { name: "EDCRFB Intelligence" },
      { name: "EDCRFB Agility" },
      { name: "EDCRFB Wisdom" },
      { name: "EDCRFB Charisma" },
    ],
  },
  /////masked
  ///female
  {
    growEditionSizeTo: 8768,
    layersOrder: [
      { name: "QWERTYU Sex" },
      { name: "QWERTYU Origin" },
      { name: "Background" },
      { name: "Background Pattern" },
      { name: "Back Gear" },
      { name: "QWERTYU Body" },
      { name: "QWERTYU Eyes" },
      { name: "QWERTYU Tatoo" },
      { name: "QWERTYU Masked" },
      { name: "QWERTYU Hair" },
      { name: "QWERTYU Clothes" },
      { name: "QWERTYU Ear Wear" },
      { name: "Effect" },
      //levels
      { name: "EDCRFB Level" },
      { name: "EDCRFB Strength" },
      { name: "EDCRFB Dexterity" },
      { name: "EDCRFB Constitution" },
      { name: "EDCRFB Intelligence" },
      { name: "EDCRFB Agility" },
      { name: "EDCRFB Wisdom" },
      { name: "EDCRFB Charisma" },
    ],
  },
  ///Gold///
  //female//
  {
    growEditionSizeTo: 8811,
    layersOrder: [
      { name: "ASDFGHJ Sex" },
      { name: "ASDFGHJ Origin" },
      { name: "ASDFGHJ Background" },
      { name: "ASDFGHJ Background Pattern" },
      { name: "ASDFGHJ Back Gear" },
      { name: "ASDFGHJ Body" },
      { name: "ASDFGHJ Eyes" },
      { name: "ASDFGHJ Makeup" },
      { name: "ASDFGHJ Hair" },
      { name: "ASDFGHJ Clothes" },
      { name: "ASDFGHJ Ear Wear" },
      { name: "ASDFGHJ Effect" },
      //levels
      { name: "POIUYTR Level" },
      { name: "POIUYTR Strength" },
      { name: "POIUYTR Dexterity" },
      { name: "POIUYTR Constitution" },
      { name: "POIUYTR Intelligence" },
      { name: "POIUYTR Agility" },
      { name: "POIUYTR Wisdom" },
      { name: "POIUYTR Charisma" },
    ],
  },
  ///Gold///
  //male//
  {
    growEditionSizeTo: 8862,
    layersOrder: [
      { name: "BAASDFGHJ Sex" },
      { name: "BAASDFGHJ Origin" },
      { name: "BAASDFGHJ Background" },
      { name: "BAASDFGHJ Background Pattern" },
      { name: "BAASDFGHJ Back Gear" },
      { name: "BAASDFGHJ Body" },
      { name: "BAASDFGHJ Eyes" },
      { name: "BAASDFGHJ Hair" },
      { name: "BAASDFGHJ Shirt" },
      { name: "BAASDFGHJ Clothes" },
      { name: "BAASDFGHJ Ear Wear" },
      { name: "BAASDFGHJ Effect" },
      //levels
      { name: "POIUYTR Level" },
      { name: "POIUYTR Strength" },
      { name: "POIUYTR Dexterity" },
      { name: "POIUYTR Constitution" },
      { name: "POIUYTR Intelligence" },
      { name: "POIUYTR Agility" },
      { name: "POIUYTR Wisdom" },
      { name: "POIUYTR Charisma" },
    ],
  },
  /// warlords
  // male
  {
    growEditionSizeTo: 9134,
    layersOrder: [
      { name: "POIUYTR Sex" },
      { name: "POIUYTR Origin" },
      { name: "POIUYTR Background" },
      { name: "POIUYTR Background Pattern" },
      { name: "POIUYTR Back Gear" },
      { name: "POIUYTR Body" },
      { name: "POIUYTR Eyes" },
      { name: "POIUYTR Tatoo" },
      { name: "POIUYTR Facial Features" },
      { name: "POIUYTR Facial Wear" },
      { name: "POIUYTR Hair" },
      { name: "POIUYTR Shirt" },
      { name: "POIUYTR Clothes" },
      { name: "POIUYTR Ear Wear" },
      { name: "POIUYTR Effect" },
      //levels
      { name: "ASDFGHJ Level" },
      { name: "ASDFGHJ Strength" },
      { name: "ASDFGHJ Dexterity" },
      { name: "ASDFGHJ Constitution" },
      { name: "ASDFGHJ Intelligence" },
      { name: "ASDFGHJ Agility" },
      { name: "ASDFGHJ Wisdom" },
      { name: "ASDFGHJ Charisma" },
    ],
  },
  /// warlords
  // female
  {
    growEditionSizeTo: 9377,
    layersOrder: [
      { name: "LKJHGFD Sex" },
      { name: "LKJHGFD Origin" },
      { name: "LKJHGFD Background" },
      { name: "LKJHGFD Background Pattern" },
      { name: "LKJHGFD Back Gear" },
      { name: "LKJHGFD Body" },
      { name: "LKJHGFD Eyes" },
      { name: "LKJHGFD Tatoo" },
      { name: "LKJHGFD Makeup" },
      { name: "LKJHGFD Facial Features" },
      { name: "LKJHGFD Facial Wear" },
      { name: "LKJHGFD Hair" },
      { name: "LKJHGFD Clothes" },
      { name: "LKJHGFD Ear Wear" },
      { name: "LKJHGFD Effect" },
      //levels
      { name: "ASDFGHJ Level" },
      { name: "ASDFGHJ Strength" },
      { name: "ASDFGHJ Dexterity" },
      { name: "ASDFGHJ Constitution" },
      { name: "ASDFGHJ Intelligence" },
      { name: "ASDFGHJ Agility" },
      { name: "ASDFGHJ Wisdom" },
      { name: "ASDFGHJ Charisma" },
    ],
  },
  // Angels
  // male
  {
    growEditionSizeTo: 9606,
    layersOrder: [
      { name: "QAZWSX Sex" },
      { name: "QAZWSX Origin" },
      { name: "QAZWSX Background" },
      { name: "QAZWSX Background Pattern" },
      { name: "QAZWSX Back Gear" },
      { name: "QAZWSX Body" },
      { name: "QAZWSX Eyes" },
      { name: "QAZWSX Tatoo" },
      { name: "QAZWSX Facial Features" },
      { name: "QAZWSX Facial Wear" },
      { name: "QAZWSX Hair" },
      { name: "QAZWSX Shirt" },
      { name: "QAZWSX Clothes" },
      { name: "QAZWSX Ear Wear" },
      { name: "QAZWSX Effect" },
      //levels
      { name: "ASDFGHJ Level" },
      { name: "ASDFGHJ Strength" },
      { name: "ASDFGHJ Dexterity" },
      { name: "ASDFGHJ Constitution" },
      { name: "ASDFGHJ Intelligence" },
      { name: "ASDFGHJ Agility" },
      { name: "ASDFGHJ Wisdom" },
      { name: "ASDFGHJ Charisma" },
    ],
  },
  // Angels
  // female
  {
    growEditionSizeTo: 9791,
    layersOrder: [
      { name: "EDCRFB Sex" },
      { name: "EDCRFB Origin" },
      { name: "EDCRFB Background" },
      { name: "EDCRFB Background Pattern" },
      { name: "EDCRFB Back Gear" },
      { name: "EDCRFB Body" },
      { name: "EDCRFB Eyes" },
      { name: "EDCRFB Tatoo" },
      { name: "EDCRFB Makeup" },
      { name: "EDCRFB Facial Features" },
      { name: "EDCRFB Facial Wear" },
      { name: "EDCRFB Hair" },
      { name: "EDCRFB Clothes" },
      { name: "EDCRFB Ear Wear" },
      { name: "EDCRFB Effect" },
      //levels
      { name: "ASDFGHJ Level" },
      { name: "ASDFGHJ Strength" },
      { name: "ASDFGHJ Dexterity" },
      { name: "ASDFGHJ Constitution" },
      { name: "ASDFGHJ Intelligence" },
      { name: "ASDFGHJ Agility" },
      { name: "ASDFGHJ Wisdom" },
      { name: "ASDFGHJ Charisma" },
    ],
  },
  ///Ghouls///
  // female
  {
    growEditionSizeTo: 9883,
    layersOrder: [
      { name: "WRAITHFEMALE Sex" },
      { name: "WRAITHFEMALE Origin" },
      { name: "WRAITHFEMALE Background" },
      { name: "ASDFGHJ Background Pattern" },
      { name: "ASDFGHJ Back Gear" },
      { name: "WRAITHFEMALE Body" },
      { name: "EDCRFB Tatoo" },
      { name: "WRAITHFEMALE Eyes" },
      { name: "WRAITHFEMALE Hair" },
      { name: "WRAITHFEMALE Clothes" },
      { name: "ASDFGHJ Ear Wear" },
      { name: "WRAITHFEMALE Effect" },
      //levels
      { name: "POIUYTR Level" },
      { name: "POIUYTR Strength" },
      { name: "POIUYTR Dexterity" },
      { name: "POIUYTR Constitution" },
      { name: "POIUYTR Intelligence" },
      { name: "POIUYTR Agility" },
      { name: "POIUYTR Wisdom" },
      { name: "POIUYTR Charisma" },
    ],
  },
  ///Ghouls///
  // male
  {
    growEditionSizeTo: 10000,
    layersOrder: [
      { name: "WRAITHMALE Sex" },
      { name: "WRAITHMALE Origin" },
      { name: "WRAITHMALE Background" },
      { name: "BAASDFGHJ Background Pattern" },
      { name: "BAASDFGHJ Back Gear" },
      { name: "WRAITHMALE Body" },
      { name: "QAZWSX Tatoo" },
      { name: "WRAITHMALE Eyes" },
      { name: "WRAITHMALE Hair" },
      { name: "WRAITHMALE Shirt" },
      { name: "WRAITHMALE Clothes" },
      { name: "BAASDFGHJ Ear Wear" },
      { name: "WRAITHMALE Effect" },
      //levels
      { name: "POIUYTR Level" },
      { name: "POIUYTR Strength" },
      { name: "POIUYTR Dexterity" },
      { name: "POIUYTR Constitution" },
      { name: "POIUYTR Intelligence" },
      { name: "POIUYTR Agility" },
      { name: "POIUYTR Wisdom" },
      { name: "POIUYTR Charisma" },
    ],
  },
];


const shuffleLayerConfigurations = true;

const debugLogs = false;

const format = {
  width: 3000,
  height: 3000,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000000;

const preview = {
  thumbPerRow: 50,
  thumbWidth: 50,
  imageRatio: format.width / format.height,
  imageName: "preview.png",
};

module.exports = {
  format,
  baseUri,
  externalUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
};
