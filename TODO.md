# Development roadmap
* Work on Area Text fix: text boxes need to expand reactively to accommodate translated text longer than original
* Add numeric check to translate.py: we don't need to translate a text box that only contains numbers

---

### Changelog

Date | Change
----|-----
2025-7-15 | Version 0.3.3: Remove "@echo off" for Windows prompt; more extensive Gcloud logging from translate.py
2025-7-8 | Version 0.3.2: Rewrite translate.py to make requests in chunks
2025-6-24 | Version 0.3.1: Add dev_mode flag to translate.py
2025-6-20 | Disable runMultiple, many small fixes for second team release
2025-6-16 | Extract and re-apply font style information
2025-5-29 | Standardize at version 0.3
2025-5-15 | One click export-import
2025-3-17 | Add AFP SSL certificate, implement API retry mechanism
2025-3-04 | Resolved OneDrive issue in Windows!
2025-2-28 | Create translate.bat file for Windows
2025-2-25 | Fix bug where tab (\t) characters not handled
2025-2-24 | Target language now selected from dialogue box. Translated files now save to Documents/TextConvert; directory structure written in cross-platform way.
2025-2-21 | Translate multiple works!
2025-2-21 | Scripts now write to filename based on .ai file (not input.json); API URL now read from config.json.
2025-2-20 |  Line reconstruction

---

## Stage 2 release
* Completed 2025-6-20

## Stage 3 release
* Research Arabic R-L text possibilities
* Rewrite using [Adobe CEP](https://github.com/Adobe-CEP)
* Start writing tests (?)

## Bugs and examples

Bug: Error caused by type of text box (red frame) used in graphic | 
Example: 36TW4YQ - Hakuto-R lunar mission

Bug: Unexpected end of JSON input | 
Example: 36YA72

---

### References
* https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html
* https://github.com/creold/illustrator-scripts
* https://github.com/newsdev/ai2html
