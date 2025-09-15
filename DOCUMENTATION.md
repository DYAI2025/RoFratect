# Fraud Protect Browser Extension - Dokumentation

## 📋 Übersicht

**Fraud Protect** ist eine Chrome Browser Extension (Manifest V3), die Chat-Nachrichten in Echtzeit auf Romance- und Investment-Fraud-Muster analysiert. Die Extension erkennt verdächtige Kommunikationsmuster und warnt Benutzer vor potenziellen Betrugsversuchen.

## 🏗️ Architektur

### Kernkomponenten

```text
fraud-protect-ext/
├── manifest.json          # Extension-Konfiguration
├── markers/              # Fraud-Erkennungsregeln
│   ├── registry.json     # Konfiguration & Thresholds
│   ├── high/            # Hochrisiko-Marker
│   └── medium/          # Mittelrisiko-Marker
└── src/
    ├── background/       # Service Worker
    ├── content/         # Content Script & UI
    ├── engine/          # Scoring-Engine
    ├── adapters/        # Plattform-Adapter
    └── popup/           # Einstellungen-Interface
```

## 🔧 Technische Details

### Manifest V3 Konfiguration

```json
{
  "manifest_version": 3,
  "name": "Fraud Protect: Romance/Investment Early Warning",
  "version": "1.0.0",
  "permissions": ["storage", "scripting", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "src/background/sw.js" },
  "action": { "default_popup": "src/popup/popup.html" },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/content.js"],
      "css": ["src/content/styles.css"],
      "run_at": "document_idle",
      "type": "module"
    }
  ]
}
```

### Content Script (ES6 Module)

Das Content Script läuft als ES6-Modul und importiert alle notwendigen Komponenten:

- **Rules Engine**: Lädt Registry und Marker
- **Scoring Engine**: Bewertet Nachrichten
- **Adapter Manager**: Wählt passenden Plattform-Adapter
- **UI Overlay**: Zeigt Warnungen an

## 🎯 Fraud-Erkennungssystem

### Marker-Kategorien

| Kategorie | Bedeutung            | Beispiel                              |
| --------- | -------------------- | ------------------------------------- |
| **SEM**   | Semantic (Bedeutung) | Zahlungsmethoden, Investment-Angebote |
| **ATO**   | Attempted (Versucht) | Webcam-Anfragen, Love Bombing         |
| **CLU**   | Cluster (Muster)     | Inkonsistente Angaben, Namenswechsel  |

### Scoring-Mechanismus

#### Basis-Scoring

```javascript
// Jeder aktive Marker trägt zu Score bei
raw_score += marker.weight * category_weight;

// Finale Score mit Multiplikatoren
final_score = raw_score * synergy_multiplier;
```

#### Thresholds & Warnstufen

| Stufe     | Score-Bereich | Farbe       | Bedeutung              |
| --------- | ------------- | ----------- | ---------------------- |
| **NONE**  | < 0.55        | Transparent | Kein Risiko            |
| **WARN**  | 0.55 - 0.68   | 🟡 Gelb     | Erhöhte Aufmerksamkeit |
| **FRAUD** | 0.68 - 0.78   | 🔴 Rot      | Hohes Risiko           |
| **HIGH**  | > 0.78        | 🟣 Lila     | Extrem hohes Risiko    |

#### Killer Combos

- `SEM_PAYMENT_METHOD_REQUEST` + `ATO_LOVE_BOMBING`
- `SEM_INVESTMENT_PIVOT` + `SEM_MT4_MT5_EXCHANGE`

### Marker-Beispiele

#### Pattern-basierte Marker

```json
{
  "id": "SEM_PAYMENT_METHOD_REQUEST",
  "category": "SEM",
  "weight": 1.5,
  "patterns": [
    "(?i)\\b(apple|steam|gift) card[s]?\\b",
    "(?i)\\b(usdt|btc|crypto (only|preferred))\\b"
  ]
}
```

#### Collect-basierte Marker

```json
{
  "id": "CLU_AGE_INCONSISTENCY",
  "category": "CLU",
  "weight": 1.0,
  "collect": {
    "regex": "(?i)\\b(i('| a)?m|ich bin)\\s*(\\d{2})\\b",
    "field": 3,
    "min_distinct": 2
  }
}
```

## 🔌 Plattform-Adapter

### Unterstützte Plattformen

| Plattform        | Adapter          | Erkennungsmerkmal       |
| ---------------- | ---------------- | ----------------------- |
| **WhatsApp Web** | WhatsAppAdapter  | `web.whatsapp.com`      |
| **Instagram DM** | InstagramAdapter | `instagram.com/direct/` |
| **Telegram Web** | TelegramAdapter  | `web.telegram.org`      |
| **Alle anderen** | GenericAdapter   | Fallback                |

### Adapter-Interface

```typescript
interface SiteAdapter {
  match(host: string, url: string): boolean;
  scanAll(doc: Document): Message[];
  observe(doc: Document, onChange: (msgs: Message[]) => void): () => void;
  threadId?(doc: Document): string;
}

interface Message {
  id: string;
  ts?: number;
  speaker: "me" | "peer" | "unknown";
  text: string;
}
```

### WhatsAppAdapter Beispiel

```javascript
export const WhatsAppAdapter = {
  match: (h, u) => /web\.whatsapp\.com$/.test(h),
  scanAll(doc) {
    const rows = doc.querySelectorAll('[role="row"]');
    return rows.map((row) => ({
      id: row.getAttribute("data-id"),
      speaker: row.querySelector('[data-testid="msg-out"]') ? "me" : "peer",
      text: row.querySelector('[data-testid="msg-container"]')?.innerText,
    }));
  },
  observe(doc, onChange) {
    const mo = new MutationObserver(
      utils.debounce(() => onChange(this.scanAll(doc)), 120)
    );
    mo.observe(doc.body, { subtree: true, childList: true });
    return () => mo.disconnect();
  },
};
```

## 🎨 Benutzeroberfläche

### Overlay-Design

Das Overlay erscheint rechts unten und zeigt:

- **Badge**: Aktuelle Warnstufe + Score
- **Hinweise**: Erkannte Marker (max. 5)
- **Aktionen**: "Interaktion stoppen" + "Melden"

### Responsive CSS

```css
#__fp_overlay {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483647;
  background: color-mix(in srgb, Canvas 92%, #000 8%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}
```

### Dark Mode Support

Automatische Anpassung an System-Theme:

```css
@media (prefers-color-scheme: dark) {
  #__fp_overlay {
    background: color-mix(in srgb, #111 85%, #fff 15%);
  }
}
```

## ⚙️ Konfiguration

### Popup-Interface

Das Popup erlaubt Anpassung der:

- **Aktivierung**: Extension an/aus
- **Thresholds**: Grenzwerte für Warnstufen
- **Einstellungen**: Werden in `chrome.storage.local` gespeichert

### Standard-Konfiguration

```javascript
const defaultSettings = {
  enabled: true,
  thresholds: {
    warn: 0.55,
    fraud_pred: 0.68,
    high: 0.78,
  },
};
```

## 🔄 Live-Updates

### MutationObserver

Jeder Adapter verwendet `MutationObserver` für Echtzeit-Updates:

```javascript
observe(doc, onChange) {
  const mo = new MutationObserver(
    utils.debounce(() => onChange(this.scanAll(doc)), 150)
  );
  mo.observe(doc.body, {
    subtree: true,
    childList: true,
    characterData: true
  });
  return () => mo.disconnect();
}
```

### Debouncing

Updates werden debounced um Performance zu optimieren:

- WhatsApp: 120ms
- Instagram: 150ms
- Telegram: 150ms
- Generic: 200ms

## 💾 Datenspeicherung

### Lokaler Speicher

- **Einstellungen**: `chrome.storage.local.fp_settings`
- **Thread-Zustand**: `chrome.storage.local.fp_state_{threadId}`

### Thread-Identifikation

```javascript
// WhatsApp
threadId() { return location.pathname; }

// Instagram
threadId() { return new URL(location.href).pathname; }

// Telegram
threadId() { return location.search || location.hash; }
```

## 🛠️ Entwicklung

### Installation

1. Chrome öffnen → `chrome://extensions/`
2. Developer Mode aktivieren
3. "Entpackt laden" → Extension-Ordner auswählen
4. Extension-Icon in Toolbar klicken

### Debugging

- **Console**: `chrome://extensions/` → Extension → "Hintergrundseite"
- **Content Script**: Auf Zielseite Rechtsklick → "Untersuchen"
- **Reload**: Nach Code-Änderungen Extension refreshen

### Erweiterte Marker

Neue Marker können hinzugefügt werden:

1. JSON-Datei in `markers/high/` oder `markers/medium/` erstellen
2. In `rules.js` Liste ergänzen
3. Registry bei Bedarf anpassen

## 🔒 Sicherheit & Datenschutz

- **Keine Datenübertragung**: Alle Analysen lokal im Browser
- **Minimale Permissions**: Nur `storage`, `activeTab`, `<all_urls>`
- **Thread-spezifisch**: Zustand pro Chat-Thread gespeichert
- **Opt-in**: Benutzer kann Extension jederzeit deaktivieren

## 📈 Performance

- **Debounced Updates**: Verhindert übermäßige Rechenlast
- **RingBuffer**: Begrenzt Nachrichten-Speicher auf 200 Einträge
- **Lazy Loading**: Marker werden bei Bedarf geladen
- **Efficient DOM-Queries**: Optimierte Selektoren pro Plattform

## 🚀 Roadmap

### Geplante Features

- **Mehr Plattformen**: Discord, Facebook Messenger
- **ML-Integration**: Machine Learning für bessere Erkennung
- **Cloud-Sync**: Einstellungen-Synchronisation
- **Reporting**: Anonyme Fraud-Berichterstattung
- **Whitelist**: Vertrauenswürdige Kontakte

### Bekannte Limitationen

- **Sprachabhängig**: Aktuell deutsch-optimierte Patterns
- **Plattform-spezifisch**: Erkennung auf bekannte DOM-Strukturen angewiesen
- **False Positives**: Komplexe Konversationen können Fehlalarme auslösen

---

**Entwickelt für**: Schutz vor Online-Betrug in Chat-Anwendungen
**Technologie**: Chrome Extension Manifest V3, ES6 Modules, MutationObserver
**Status**: Funktionsfähig, erweiterbar
