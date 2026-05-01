const MAX_FILE_SIZE = 8 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const sampleImages = [
  {
    label: "Golden Retriever",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg/640px-Golden_Retriever_Dukedestiny01_drvd.jpg"
  },
  {
    label: "Tasse",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/640px-A_small_cup_of_coffee.JPG"
  },
  {
    label: "Fahrrad",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Left_side_of_Flying_Pigeon.jpg/640px-Left_side_of_Flying_Pigeon.jpg"
  },
  {
    label: "Banane",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/640px-Banana-Single.jpg"
  },
  {
    label: "Laptop",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/IBM_ThinkPad_R51.jpg/640px-IBM_ThinkPad_R51.jpg"
  }
];

const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const previewImage = document.querySelector("#preview-image");
const emptyPreview = document.querySelector("#empty-preview");
const modelStatus = document.querySelector("#model-status");
const modelDot = document.querySelector("#model-dot");
const resultSummary = document.querySelector("#result-summary");
const resultBars = document.querySelector("#result-bars");
const feedback = document.querySelector("#feedback");
const examples = document.querySelector("#examples");

let classifier;
let modelReady = false;

function setStatus(message, state = "loading") {
  modelStatus.textContent = message;
  modelDot.className = `status-dot ${state === "ready" ? "ready" : ""} ${state === "error" ? "error" : ""}`;
}

function setFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.style.color = isError ? "var(--warning)" : "var(--muted)";
}

function renderExamples() {
  const cards = sampleImages.map((sample, index) => {
    return `
      <button class="example-card" type="button" data-index="${index}">
        <img crossorigin="anonymous" src="${sample.url}" alt="${sample.label}">
        <span>${sample.label}</span>
      </button>
    `;
  });

  examples.innerHTML = cards.join("");
}

function validateFile(file) {
  if (!file) {
    return "Es wurde keine Datei ausgewählt.";
  }

  if (!VALID_TYPES.includes(file.type)) {
    return "Bitte wähle ein Bild im Format PNG, JPEG, WebP oder GIF.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Das Bild ist grösser als 8 MB. Bitte wähle eine kleinere Datei.";
  }

  return "";
}

function showImage(src, alt) {
  previewImage.crossOrigin = "anonymous";
  previewImage.src = src;
  previewImage.alt = alt;
  emptyPreview.classList.add("hidden");
  resultSummary.textContent = "Bild wird vorbereitet...";
  resultBars.innerHTML = "";
}

function classifyCurrentImage() {
  if (!modelReady) {
    resultSummary.textContent = "Warte auf das Modell";
    setFeedback("Das Modell wird noch geladen. Die Klassifikation startet gleich danach.");
    return;
  }

  if (!previewImage.complete || !previewImage.naturalWidth) {
    return;
  }

  resultSummary.textContent = "Analysiere Bild...";
  setFeedback("Klassifikation läuft direkt im Browser.");

  classifier.classify(previewImage, (error, results) => {
    if (error) {
      resultSummary.textContent = "Klassifikation fehlgeschlagen";
      resultBars.innerHTML = "";
      setFeedback("Das Bild konnte nicht klassifiziert werden. Probiere ein anderes Bild oder verwende ein Beispielbild.", true);
      return;
    }

    renderResults(results.slice(0, 5));
  });
}

function renderResults(results) {
  if (!results.length) {
    resultSummary.textContent = "Keine Ergebnisse";
    resultBars.innerHTML = "";
    setFeedback("MobileNet konnte das Bild nicht erkennen und daher keine passende Klasse zurückgeben.", true);
    return;
  }

  resultSummary.textContent = `${results.length} Treffer`;
  resultBars.innerHTML = results.map((result) => {
    const percent = Math.max(0, Math.min(100, result.confidence * 100));
    const label = result.label.replace(/,/g, ", ");

    return `
      <div class="result-row">
        <div class="result-label">
          <span>${label}</span>
          <span>${percent.toFixed(1)}%</span>
        </div>
        <div class="bar-track" aria-label="${label}: ${percent.toFixed(1)} Prozent">
          <div class="bar-fill" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");

  setFeedback("Die Balken zeigen die Konfidenzwerte der wahrscheinlichsten MobileNet-Klassen an.");
}

function handleFile(file) {
  const validationError = validateFile(file);

  if (validationError) {
    resultSummary.textContent = "Datei abgelehnt";
    resultBars.innerHTML = "";
    setFeedback(validationError, true);
    return;
  }

  const url = URL.createObjectURL(file);
  showImage(url, `Hochgeladenes Bild: ${file.name}`);
}

fileInput.addEventListener("change", (event) => {
  handleFile(event.target.files[0]);
});

previewImage.addEventListener("load", () => {
  classifyCurrentImage();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  handleFile(event.dataTransfer.files[0]);
});

examples.addEventListener("click", (event) => {
  const card = event.target.closest(".example-card");

  if (!card) {
    return;
  }

  const sample = sampleImages[Number(card.dataset.index)];
  showImage(sample.url, `Beispielbild: ${sample.label}`);
});

renderExamples();

try {
  classifier = ml5.imageClassifier("MobileNet", () => {
    modelReady = true;
    setStatus("Modell bereit", "ready");

    if (previewImage.src) {
      classifyCurrentImage();
    }
  });
} catch (error) {
  setStatus("Modell konnte nicht geladen werden", "error");
  setFeedback("ml5.js oder MobileNet konnte nicht geladen werden.", true);
}
