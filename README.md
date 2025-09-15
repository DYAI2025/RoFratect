# Fraud Protect Chrome Extension (MV3)

Portables Site-Adapter-Interface + Marker/Scoring-Engine.

- Load unpacked: `fraud-protect-ext/`
- Popup: Schwellen und Aktiv-Flag
- Privacy: keine externen Calls, alles lokal

Ordner:
- `src/adapters/` Site-Adapter (WhatsApp, Instagram, Telegram, Generic)
- `src/content/` Overlay und Content-Glue
- `src/engine/` Marker-Registry und Scoring
- `markers/` Marker-JSONs und Registry
- `src/background/` Init von Defaults
- `src/popup/` Settings UI

Hinweis: Icons sind absichtlich weggelassen, um Load-Probleme mit Platzhalterdateien zu vermeiden.

