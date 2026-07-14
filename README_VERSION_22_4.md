# Alltagsbegleiter Version 22.4

Stabilitätskorrektur für den Android-Import.

## Korrektur

Der native Android-Dateidialog verwendet beim Öffnen keinen einschränkenden MIME-Filter mehr. Android-Geräte und Dateimanager melden CSV-Dateien uneinheitlich, wodurch sichtbare Dateien bisher teilweise nicht auswählbar waren. Version 22.4 erlaubt im Dateidialog deshalb alle öffnungsfähigen Dateien; das jeweilige Modul verarbeitet anschließend den gewählten Inhalt.

Unterstützte Anwendungsfälle:

- CSV: Blutdruck, Gewicht, Training und weitere Tabellen
- JSON / ABG / DKBACKUP: Gesamtsicherungen und Modul-Sicherungen
- TXT: Textbasierte Sicherungen und Exporte

Versionsstand: 22.4
versionCode: 2240
