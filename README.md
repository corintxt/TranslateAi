# Illustrator Text Convert
*Export text from Adobe Illustrator files, send to machine translation services and re-import.*

## Installation

To access scripts from the **File > Scripts** menu in Illustrator, the two scripts (`TextConvert.Translate.jsx`/`TextConvert.Import.jsx`) must be placed in the **Scripts** directory.

File path may vary but will resemble:

**Windows:**

> C:\Program Files\Adobe\Adobe Illustrator {version_number}\Presets\ {language} \Scripts\

**Mac**:

> Applications > Adobe Illustrator {version_number} > Presets > {language} > Scripts

The `translate.command` script must also be placed in the same directory, and made into an **executable file**:

`chmod +x translate.command`

## Usage
* Open an Illustrator document containing text to be translated
* Click **File > Scripts > TextConvert.Translate**
    * Text from the Illustrator doc is extracted and written to a temp file. Illustrator script calls command script which sends contents of text file to translation API, then writes response to same file.
* Click **File > Scripts > TextConvert.Import**
    * Translated text will be reimported into the file in the correct places

---

### TODO:
* Make 'plug and play' command scripts for different translation APIs, or abstract this part of the code so that user can easily do so


### BUGS / TOFIX:
* Translated text does not respect original boundary box
* Multiple colors within same text box are lost