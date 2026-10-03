# Japanischer Tempel – 3D

Eine navigierbare 3D-Szene eines japanischen Tempels im Browser, gebaut mit [three.js](https://threejs.org/). Alles steckt in einer einzigen Datei: `tempel.html`.

## Starten

Die Seite lädt three.js per CDN (jsdelivr) und braucht deshalb Internet. Sie muss über HTTP ausgeliefert werden, nicht per `file://`.

```bash
python3 -m http.server 8757
```

Danach im Browser öffnen: <http://localhost:8757/tempel.html>

## Bedienung

| Aktion | Wirkung |
|---|---|
| Maus ziehen | Ansicht drehen |
| Mausrad | Zoomen |
| Rechtsklick oder Shift + Ziehen | Ansicht verschieben |
| Button **Regen** | Regen ein/aus |
| Button **Tag / Nacht** | Zwischen Tag und Nacht überblenden |
| Button **Auto-Rotation** | Kamera kreist automatisch |

## Was in der Szene steckt

- **Haupthalle** mit Steinsockel, Treppe, roten Holzpfeilern, Shoji-Türen, Veranda und zweistöckigem, geschwungenem Dach
- **Tokyo Tower** (anstelle der früheren Pagode)
- **Zwei Torii-Tore** und ein Pfad mit Steinlaternen
- **Teich** mit Holzbrücke
- **Kiefern und Kirschbäume**
- **Drei Damhirsche und eine Giraffe**, die auf festen Wegen durch die Szene laufen
- **Regen**, der Himmel, Licht und Nebel abdunkelt
- **Nacht** mit leuchtenden Laternen

Alle Texturen (Stein, Holz, Ziegel, Gras, Rinde, Laub, Papier) werden beim Laden per Canvas-Code erzeugt. Es gibt keine Bilddateien.

## Technik

- three.js 0.160.0 mit `OrbitControls`, eingebunden über eine `importmap`
- Keine Build-Schritte, keine Abhängigkeiten zum Installieren
- Technische Hinweise zum Aufbau der Datei stehen in [CLAUDE.md](CLAUDE.md)
