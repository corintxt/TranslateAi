# TODO / development roadmap

## Beta release 
For beta release:

* Write list of things TranslateAi *can* and *can't* handle -- e.g. can't do different text formats in same text box.
* Change folder paths from devmode to prod => remove references to personal file system in main branch

## Stage 2 release
* Look at how to fix SSL cert warning in translate.py (ask Baptiste at DSI)
* Fix bugs (see below and in Basecamp)
* Research Arabic R-L text possibilities
* Start writing tests (!) in order to make changes and know nothing will break.

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