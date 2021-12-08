import * as vars from "./variables/vars.js";

/********************
 * DEFINITIONS
 *******************/

var newJson,
  onWebRefs,
  XmlText,
  imgFucked,
  var katy = [],
  editCat = [],
  addCat = [],
  JSONIK = [];

const load = document.querySelector(".loader-back"),
  fileCsv = document.querySelector("#fileCsv"),
  list = document.querySelector(".imgList"),
  // SETTINGS
  allSet = document.querySelector("#allSet"),
  langSet = document.querySelector("#langSet"),
  setShort = document.querySelector("#setShort"),
  setPrices = document.querySelector("#setPrices"),
  setImages = document.querySelector("#setImages"),
  setCats = document.querySelector("#setCats"),
  setTranslate = document.querySelector("#setTranslate");

/****************************
 * SETTINGS CHECKER
 ****************************/

function notDelete() {
  if (!setShort.checked) {
    setPrices.disabled = true;
    setImages.disabled = true;
    setTranslate.disabled = true;
    setCats.disabled = true;
  } else {
    setPrices.disabled = false;
    setImages.disabled = false;
    setTranslate.disabled = false;
    setCats.disabled = false;
  }
}

/****************************
 * CREATE CSV FILE 
 * **************************/

// GET REFS FROM WEBSITE 
async function getCurrentList(link, lang) {
  // LOADER SHOW
  loader(true);
  // WAIT FOR FETCH, THEN EXECUTE READ CSV
  await fetch(link)
    .then((response) => response.text())
    .then((data) => (XmlText = getActRef(data)));
  //   readCsv()
  readJSON(lang);
}

// XML TO NODE THEN VALUES, ARRAY OF REFS ON WEBSITE
function getActRef(link) {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(link, "text/xml");
  var refy = xmlDoc.getElementsByTagName("reference");
  var refs = [];
  for (let i = 0; i < refy.length; i++) {
    // WAY TO EXTRACT TEXT FROM NODE
    let item = refy[i].firstChild.nodeValue;
    refs.push(item);
  }
  // ADD BLACKLIST TO ON WEB LIST
  onWebRefs = refs.concat(vars.blackList);
}

// CREATE NEW JSON OBJECT
function uniqueSilSimple(silentbloky, lang, refs = false) {
  const t0 = performance.now();
  // ALL OR FILTERED OR INPUT
  var newList;
  if (refs) {
    console.log("prvy");
    var newList = silentbloky.filter((sil) => refs.includes(sil.reference));
  } else if (allSet.checked) {
    console.log("druhy");
    var newList = silentbloky.filter(function (sil) {
      return onWebRefs.indexOf(sil.reference) == -1;
    });
  } else {
    console.log("treti");
    var newList = silentbloky;
  }
  let i = 1,
    imgList = [];
  newList.forEach((silent) => {
    i++;
    // SETTINGS
    if (!setShort.checked) {
      // NOT SHORT CSV
      silent.MA_KLIK =
        Object.keys(silent.combinations).length == 0
          ? "bez klikacky"
          : "klikacka";
      silent.MANUFACTURER = 4;
      silent.MIN_ORDER = silent.features["Required/car"]
        ? silent.features["Required/car"]
        : "1";
      silent.JEDNOTKA = 1;
      // IMAGES
      imgList.push(silent.images);
      silent.IMG_LINKS = getImgLnk(silent.images);
      // CATS
      silent.KATEGORIE_NARYCHLO = Object.values(silent.categories).join(" ^ ");
      silent.ID_CATEGORIE = newCat(silent);
      newCat(silent);
      // PRICES
      silent.NAKUPNA = getPurchasePrice(silent.price, silent.name);
      silent.PREDAJ_CENA = getSalePrice(silent.NAKUPNA);
      // TRANSLATE
      langSpecific(silent, i, lang, silent.reference);
      silent.FEATS = getHardFeatSK(silent.reference);
    } // ONLY TRANSLATE CSV
    else if (setTranslate.checked && setShort.checked) {
      langSpecific(silent, i, lang, silent.reference);
      silent.FEATS = getHardFeatSK(silent.reference);
    } // ONLY PRICES CSV
    else if (setPrices.checked && setShort.checked) {
      silent.NAKUPNA = getPurchasePrice(silent.price, silent.name);
      silent.PREDAJ_CENA = getSalePrice(silent.NAKUPNA);
      deleteTextCols(silent, true);
    } // ONLY CATS CSV
    else if (setCats.checked && setShort.checked) {
      silent.KATEGORIE_NARYCHLO = Object.values(silent.categories).join(" ^ ");
      silent.ID_CATEGORIE = newCat(silent);
      deleteTextCols(silent, true);
    } // ONLY IMGS CSV
    else if (setImages.checked && setShort.checked) {
      imgList.push(silent.images);
      silent.IMG_LINKS = getImgLnk(silent.images);
      deleteTextCols(silent, true);
    }
    deleteCols(silent);
  });
  if (setImages.checked || !setShort.checked) {
    mountImgLink(imgList);
  }

  var newSilcount = Object.keys(newList).length;
  var exportJson = JSON.stringify(newList);
  document.querySelector("#count").innerText = newSilcount;
  const t1 = performance.now();
  console.log("trva to: " + (t1 - t0));
  return exportJson;
}

//CATEGORIES ALL

function vsetkycat() {
  JSONIK.forEach((silent) => {
    katy.push(Object.entries(silent.categories).join(" ^ "));
  });
  var uniqCat = [...new Set(katy.join(" ^ ").split(" ^ "))];
  console.log(uniqCat);
}


//FETCH FROM JSON
async function readJSON(refs = false) {
  await fetch("https://strongflex.eu/dealer/EXPORT_EN.json")
    .then((response) => response.json())
    .then((data) => (JSONIK = data));
  console.log("fetched");
  let lang = langSet.value;
  console.log(lang);
  newJson = uniqueSilSimple(JSONIK, lang, !refs ? false : refs);
  loader(false);
}


// REFS FROM TEXT AREA
function refsTextarea(refs) {
  let pasted = document.querySelector("#fieldOf").value;
  !refs ? (imgFucked = pasted.split("\n")) : (imgFucked = refs);
  readJSON(imgFucked);
}


// REFS FROM  UPLOADED CSV FILE
function readCsvFile() {
  Papa.parse(fileCsv.files[0], {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      let images = results.data;
      //        let imgFucked = [];
      images.forEach((refs) => {
        imgFucked.push(refs.reference);
      });
      console.log(imgFucked);
      readJSON(imgFucked);
    },
  });
}


// DOWNLOAD CSV MADE FROM READ
function downloadCSV() {
  var csv = Papa.unparse(newJson, {
    delimiter: "^",
    header: true,
  });
  console.log(csv);
  // Download CSV part
  var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var csvURL = null;
  if (navigator.msSaveBlob) {
    csvURL = navigator.msSaveBlob(csvData, "nove.csv");
  } else {
    csvURL = window.URL.createObjectURL(csvData);
  }
  // CREATE ELEMENT AND CLICK IT
  var tempLink = document.createElement("a");
  tempLink.href = csvURL;
  tempLink.setAttribute("download", "download.csv");
  tempLink.click();
}

/****************
 * CLIPBOARD INIT
 ****************/
var clipboard = new ClipboardJS(".btn");

/****************
 * LOADER
 ****************/
function loader(show) {
  show ? (load.style.display = "block") : (load.style.display = "none");
}

/****************
 *  MOUNTS
 ****************/
//MOUNT IMAGES TO COPY LINK
function mountImgLink(sfUrls) {
  let ul = "",
    links = sfUrls.flat(),
    len = links.length;
  list.innerHTML = "";
  // CREATE LONG TEMPLATE STRING, THEN PASTE
  links.forEach((url) => {
    ul += `<li class="list-group-item text-truncate">${url}</li>`;
  });
  list.innerHTML = `<p>Img links to download: <strong>${len}</strong><input type="button" id="selImgAll" value="Copy" data-clipboard-action="copy" data-clipboard-target="#links" class="btn btn-primary float-end"/></p><ul  id="links" class="list-group  overflow-auto">${ul}</ul>`;
}

//  MOUNT BLACKLISTED
function blackListed() {
  if (vars.blackList) {
    let h2 = document.createElement("h2");
    h2.innerText = "BlackListed: " + vars.blackList.length;
    document.querySelector("#blkList").appendChild(h2);
  }
}
blackListed();

//MOUNT CATS

const catCheck = document.querySelector("#catList");

function mountCats(edit, add) {
  let editBlock = [],
    addBlock = [];
  edit.forEach((cat) => {
    editBlock.push(`<tr>${cat}</tr>`);
  });
  add.forEach((cat) => {
    addBlock.push(`<tr>${cat}</tr>`);
  });
  catCheck.innerHTML = `<h3>Upravit kategorie</h3><pre><table>${editBlock}</table></pre><h3>Pridat kategorie</h3><pre><table>${addBlock}</table></pre>`;
}

/****************
 *  LISTENERS
 ****************/

setShort.addEventListener("click", function () {
  notDelete();
});

document.querySelector("#checkBtn").addEventListener("click", () => {
  getCurrentList(vars.xmlUrl);
});

document.querySelector("#dwnBtn").addEventListener("click", () => {
  downloadCSV();
});

document.querySelector("#refBtn").addEventListener("click", () => {
  refsTextarea();
});

fileCsv.addEventListener("change", () => {
  readCsvFile();
});

/****************
 * NEW CSV FIELDS
 ****************/

//PRICE
function getSalePrice(price) {
  let newPrice = Math.ceil(price * 1.42 + 3);
  return newPrice;
}

// PURCHASE PRICE
function getPurchasePrice(price, name) {
  let purchasePrice, upper;
  upper = name.toUpperCase();
  purchasePrice =
    upper.includes("KIT") && upper.includes("FULL")
      ? price * 0.7 * 0.9
      : upper.includes("KIT")
      ? price * 0.7 * 0.95
      : price * 0.7;
  return purchasePrice;
}

// CATEGORY
function getCategory(cat) {
  // CHECK IF CATEGORY HAS SUBCATEGORIES
  let catList;
  cat.search(">") === -1
    ? (catList = cat)
    : (catList = cat.replaceAll(">", `\\`));
  return catList;
}

// Category transformer
function newCat(car) {
  let len = vars.zoznam.length,
    catlist = [];
  Object.entries(car.categories).forEach((cat) => {
    let i = 0;
    vars.zoznam.forEach((item) => {
      if (item.sf_cat === cat[1]) {
        catlist.push(item.gag_id);
      } else if (item.sf_id == cat[0]) {
        editCat.push(
          `<td>${item.sf_id}</td><td>${item.sf_cat}</td><td> ${cat[1]}</td>`
        );
      } else {
        i++;
        if (i == len) {
          addCat.push(`${cat[0]}\t${cat[1]}`);
        }
      }
    });
  });
  // ONLY UNIQUE CAT TO EDIT or ADDD
  let unqEdit = [...new Set(editCat)],
    unqAdd = [...new Set(addCat)];
  mountCats(unqEdit, unqAdd);
  return catlist.join("|");
}

//Feature hardness SK
function getHardFeatSK(ref) {
  let hardFeat;
  ref.slice(6, 7) === "B"
    ? (hardFeat = `Tvrdosť:80Sha - Standart`)
    : (hardFeat = `Tvrdosť:90Sha - Sport - tvrdší`);
  return hardFeat;
}
// DESC SHORT SK
function getDesShortSK(ref) {
  let descShort;
  ref.slice(6, 7) === "B"
    ? (descShort = `<label>Tvrdosť: </label> <span class="editable">80Sha - Standart </span>`)
    : (descShort = `<label>Tvrdosť: </label> <span class="editable">90Sha - Sport </span>`);
  return descShort;
}
// DESC SHORT CZ
function getDesShortCZ(ref) {
  let descShort;
  ref.slice(6, 7) === "B"
    ? (descShort = `<label>Tvrdost: </label> <span class="editable">80Sha - Standart </span>`)
    : (descShort = `<label>Tvrdost: </label> <span class="editable">90Sha - Sport </span>`);
  return descShort;
}
// DESC SHORT EN
function getDesShortEN(ref) {
  let descShort;
  ref.slice(6, 7) === "B"
    ? (descShort = `<label>Hardness: </label> <span class="editable">80Sha - Standart </span>`)
    : (descShort = `<label>Hardness: </label> <span class="editable">90Sha - Sport </span>`);
  return descShort;
}

// MINIMAL ORDER FROM FEATURE
function getMinOrd(feat) {
  let pcs, minOrd;
  if (!feat) {
    pcs = 1;
  } else {
    minOrd = feat.match(/\d+/g).map(Number);
    pcs = minOrd[1];
  }
  return pcs;
}
//IMAGE LINK FROM SILENT WEB
function getImgLnk(images) {
  let finalUrl,
    eachImg = [];
  images.forEach((img) => eachImg.push(vars.imgDir + img.split("/").pop()));
  finalUrl = eachImg.join("|");

  return finalUrl;
}

/**
 * ALL WEB STRINGES
 */
function langSpecific(silent, counter, lang, reference) {
  if (lang == "eng") {
    silent.META_TITLE_EN = `=B${counter}&" - bushings.eu"`;
    silent.META_DESC_EN = `=B${counter}&" - almost 2500 polyurethane bushings for more than 600 cars"`;
    silent.DESC_SHORT_EN = getDesShortEN(reference);
  } else {
    silent.META_TITLE_SK = `=B${counter}&" - silentbloky.sk"`;
    silent.META_TITLE_CZ = `=B${counter}&" - polyuretanove-silentbloky.cz"`;
    silent.META_DESC_SK = `=B${counter}&" - takmer 4000 polyuretánových silentblokov STRONGFLEX, POWERFLEX, DEUTER na viac ako 600 áut"`;
    silent.META_DESC_CZ = `=B${counter}&" - téměř 4000 polyuretánových silentbloků STRONGFLEX, POWERFLEX, DEUTER na více jak 600 aut"`;
    silent.DESC_SHORT_SK = getDesShortSK(reference);
    silent.DESC_SHORT_CZ = getDesShortCZ(reference);
  }
}

// DELETE UNNSESECARY ROWS
function deleteCols(row) {
  [
    "price",
    "weight",
    "ean13",
    "combinations",
    "images",
    "categories",
    "features",
    "has_combination_price_impact",
  ].forEach((e) => delete row[e]);
}
// DELETE TEXT ROWS
function deleteTextCols(row) {
  ["name", "description"].forEach((e) => delete row[e]);
}
