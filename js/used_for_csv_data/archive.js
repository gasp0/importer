/************
 *  FUNCTION USED FOR OLD DATA FORMAT
 ************/

// MAKE FIELD TO CSV

function uniqueSil(silentbloky) {
  // VYFILTRUJ POLE NA ZAKLADE IBA 7 MIESTNEHO KODU NA ZAKLADE POZICIE V SQL V DB
  var newList = silentbloky.filter(function (sil) {
    return onWebRefs.indexOf(getShortRef(sil["REFERENCE"])) == -1;
  });
  console.log(newList);

  // vytvarame nove pole FOR EACH
  newList.forEach((silent) => {
    // CSV COLUMNS VARIABLES
    let shortRef = getShortRef(silent["REFERENCE"]),
      pName = silent["PRODUCT NAME"],
      metaTitle = getMTSk(silent["PRODUCT NAME"]),
      metaDesc = getMDSk(silent["PRODUCT NAME"]),
      pDescSht = getDesShortSK(silent["REFERENCE"]),
      price = getPrice(silent["BASE PRICE"]),
      feature = getHardFeatSK(silent["REFERENCE"]),
      cat = getCategory(silent["CATEGORIES"]),
      minOrd = getMinOrd(silent["FEATURES"]),
      imgURL = getImgLnk(silent["MAIN PICTURE"], silent["IMAGES"]);
    // CSV CREATE NEW EXPORT FORMAT
    silent.KOD = shortRef;
    silent.META_TITLE = metaTitle;
    silent.META_DESC = metaDesc;
    silent.DESC_SHORT = pDescSht;
    silent.FEATURE = feature;
    silent.PRICE = price;
    silent.CAT = cat;
    silent.MIN_ORD = minOrd;
    silent.IMG_URL = imgURL;
    // SF MNF ID IS 4
    silent.MANUF = 4;
    //  PREPARE SF IMG LIST TO DOWNLOAD
    getSfImgLnk(silent["MAIN PICTURE"], silent["IMAGES"]);
    // DELETE NOT NEEDED
    deleteCols(silent);
  });
  // MOUNT IMG LIST TO BODY
  mountImgLink();
  var newSilcount = Object.keys(newList).length;
  var exportJson = JSON.stringify(newList);
  NoD.innerText = newSilcount;
  return exportJson;
}

//FETCH FROM CSV ( WHEN JSON NOT AVAILIBLE)
function readCsv() {
  Papa.parse("https://strongflex.eu/dealer/EXPORT_EN.csv", {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: function (results) {
      csvJson = results.data;
      //  PARSE CSV AND MAKE NEW
      newJson = uniqueSil(csvJson);
    },
  });
}

//Filter AND MOUNT IMAGE LINKS TO DOWNLOAD
function merchantImgs(silentbloky) {
  // VYFILTRUJ POLE NA ZAKLADE IBA 7 MIESTNEHO KODU NA ZAKLADE POZICIE V SQL V DB
  var newList = silentbloky.filter(function (sil) {
    return imgFucked.indexOf(getShortRef(sil["REFERENCE"])) !== -1;
  });
  console.log(newList);
  newList.forEach((silent) => {
    // GET DATA FOR MOUNTING
    getSfImgLnk(silent["MAIN PICTURE"], silent["IMAGES"]);
    // GET DATA FOR CSV TO DONWLOAD
    (silent.KOD = getShortRef(silent["REFERENCE"])),
      (silent.UPLOADURL = getImgLnk(silent["MAIN PICTURE"], silent["IMAGES"]));
    // JUST FOR PRESTASHOP
    silent.DELETE = 1;
    // DELETE REDUNDANT
    deleteColsImg(silent);
  });

  mountImgLink();
  var newSilcount = Object.keys(newList).length;
  var exportJson = JSON.stringify(newList);

  NoD.innerText = newSilcount;

  return exportJson;
}

//7 miestny kod
function getShortRef(ref) {
  return ref.substring(0, 7);
}

//IMAGE LINK FROM STRONGFLEX WEB
function getSfImgLnk(main, images) {
  sfImg.push(main);
  // Other images to array
  imgX = images.split("|").map((url) => sfImg.push(url));
}

// DELETE UNNSESECARY ROWS FOR IMG CSV
function deleteColsImg(row) {
  [
    "BASE PRICE",
    "CATEGORIES",
    "EAN",
    "MAX PRICE",
    "FEATURE",
    "WEIGHT",
    "MAIN PICTURE",
    "IMAGES",
    "FEATURES",
    "DESCRIPTION",
    "ATTRIBUTES TO CHOOSE",
    "PRODUCT NAME",
    "REFERENCE",
  ].forEach((e) => delete row[e]);
}

// META TITLE SK
function getMTSk(name) {
  return `${name} - silentbloky.sk`;
}
// META DESCRIPTION SK
function getMDSk(name) {
  return `${name} - takmer 4000 polyuretánových silentblokov STRONGFLEX, POWERFLEX, DEUTER na viac ako 600 áut `;
}

/****************************
 * CREATE CSV TO UPLOAD IMAGES
 ***************************/

// List of bad IMG REFS FROM MERCHANT FROM CSV
function readBadMerchImgs() {
  Papa.parse("csv/images_needed.csv", {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: function (results) {
      let images = results.data;
      images.forEach((element) => {
        imgFucked.push(element.REFERENCE);
      });
    },
  });
}

/*
 * RETURN IMG LINKS FOR NEW IMAGES
 */
function readCsvImgs() {
  Papa.parse("https://strongflex.eu/dealer/EXPORT_EN.csv", {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: function (results) {
      csvJson = results.data;
      //  Sitahne zdrojove csv vytvori nove a ulozi do premenej     ;
      newJson = merchantImgs(csvJson);
      //  Pusti download funkciu
      console.log(newJson);
    },
  });
}

// LAUNCHER TO CREATE CSV WITH IMG LNKS
async function getImgUploadLinks() {
  await readBadMerchImgs();
  readCsvImgs();
}
