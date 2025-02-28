# TODO / development roadmap

## Beta release 
For beta release:
* Document the new install process, with screenshots
* Create the Windows file version & ask someone to test.
* Add Python error logging

* Write list of things that TranslateAi *can* and *can't* handle currently -- e.g. currently can't do multiple files; currently can't do different text formats in same text box.
* Make a feedback form for bug reporting! With screenshots uploaded etc.
* Merge to main branch:
    * Change folder paths from devmode to prod => remove references to my file system in main branch
    

## Stage 2 release
* Look into SSL cert warning in translate.py
* Should we ditch bash command script and make the whole thing Python..?
* More sophisticated logging
* Fix more bugs

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
=> Second release of the script should identify special formatting.

Bug: Unexpected end of JSON input
Example: 36YA72

---
### Changelog
2025-2-25: Fix bug where tab (\t) characters not handled
2025-2-24: Target language now selected from dialogue box. Translated files now save to Documents/TextConvert; directory structure written in cross-platform way.
2025-2-21: Translate multiple works!
2025-2-21: Scripts now write to filename based on .ai file (not input.json); API URL now read from config.json.
2025-2-20: Line reconstruction

### References
* https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html
* https://github.com/creold/illustrator-scripts
* https://github.com/newsdev/ai2html