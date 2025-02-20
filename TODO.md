* Does multiple file processing work? we either need to remove dialogue, or modify code to do batch processing.
* Eventually replace hardcoded target language with dropdown & dialogue box;
// consult scripts here for guidance: https://github.com/creold/illustrator-scripts
x

===

Next steps (dev):
* Suppress print() calls in Python -- just one final call which returns output to bash.
* JSX: Get as much info as possible from each text box when extracting (boundaries etc.); Python script can handle parsing this, keep the info that's not relevant in place, and only send the text to be translated to API.
=> reference here: https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html

--

Starting up on Weds:

* Realized that within every TextFrame item are many sub-items and properties, such as TextRange items which then also have sub-properties like how many lines the text is on.
=> In order to re-import text into the right place we will need to use a combination of anchor position, line length, etc.

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

---
## Changelog
25-2-20: Line reconstruction