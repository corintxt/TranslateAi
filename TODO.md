

* Does multiple file processing work? we either need to remove dialogue, or modify code to do batch processing.
* Eventually replace CLI target language with dropdown & dialogue box;
// consult scripts here for guidance: https://github.com/creold/illustrator-scripts
x

===

Next steps (dev):
* Think about better name!
* Test more graphics
* Work on multiple translate
    * Write to filename.json rather than 'input'

* Package for beta release:
    * Write list of things that Translator *can* and *can't* handle currently -- e.g. currently can't do multiple files; currently can't do different text formats in same text box.
    * Look into whether it could be installed with makefile, rather than step-by-step
        => Where possible, executable scripts shouldn't be in Applications folder.
        => So we make a new folder for 'TextTranslate'
    * Make a feedback form for bug reporting! With screenshots uploaded etc.
    * Switch API to prod

* Should we ditch bash command script and make the whole thing Python?
* Instead of writing to /tmp/ - maybe we should make a folder called TextTranslate (etc.) and write translations there by filename
* Look into SSL cert warning
--

Starting up on Thurs:

* Write translation to file with name of doc - so we can do multiple files at once.

## Testfiles / notes / bugs

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
## Changelog
25-2-20: Line reconstruction

## References
* https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html
* https://github.com/creold/illustrator-scripts
* https://github.com/newsdev/ai2html