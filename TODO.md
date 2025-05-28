# TODO / development roadmap

## Stage 2 release
* Fix bugs (see below and in Basecamp)
* Start writing tests (!) in order to make changes and know nothing will break.

## Stage 3 release
* Research Arabic R-L text possibilities
* Rewrite using [Adobe CEP](https://github.com/Adobe-CEP)

## Bugs and examples

Bug: Illustrator shows SPOD after running export!
Example: Inconsistent..

Bug: Error caused by type of text box (red frame) used in graphic
Example: 36TW4YQ - Hakuto-R lunar mission

Bug: Not all text in document is translated. Unsure why!
Example: 36XA3W4.ai

Bug: centered text is rendered as left-aligned
Example:

Bug: Translation does not preserve variations in text formatting within text frame
Example: 36Y44DJ (Biodiversity)

Bug: Unexpected end of JSON input
Example: 36YA72

---
### Changelog

Date | Change
----|-----
2025-3-04 | Resolved OneDrive issue in Windows!
2025-2-28 | Create translate.bat file for Windows
2025-2-25 | Fix bug where tab (\t) characters not handled
2025-2-24 | Target language now selected from dialogue box. Translated files now save to Documents/TextConvert; directory structure written in cross-platform way.
2025-2-21 | Translate multiple works!
2025-2-21 | Scripts now write to filename based on .ai file (not input.json); API URL now read from config.json.
2025-2-20 |  Line reconstruction

### References
* https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html
* https://github.com/creold/illustrator-scripts
* https://github.com/newsdev/ai2html
