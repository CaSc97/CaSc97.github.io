# EA1 Bilderkennung mit ml5.js

Statische Web-App fuer die Einsendeaufgabe "Bilderkennung mit ml5".

## Funktionen

- Bildklassifikation mit `ml5.imageClassifier("MobileNet")`
- Upload per Dateiauswahl und Drag-and-drop
- Fuenf Beispielbilder
- Anzeige der Top-Ergebnisse als Balkendiagramm
- Pruefung von Dateiformat und Dateigroesse
- Dokumentation direkt in der Anwendung

## Start

Die App besteht aus statischen Dateien und kann ueber GitHub Pages oder einen lokalen Webserver geoeffnet werden.

```powershell
python -m http.server 8000
```

Danach im Browser `http://localhost:8000` oeffnen.
