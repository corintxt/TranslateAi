// Write text to translate to a temp file:
var textToTranslate = "Hello world";
var tempFile = new File("/tmp/translate_args.txt");
tempFile.open('w');
tempFile.write(textToTranslate);
tempFile.close();

// Execute command file:
var commandFile = File(File($.fileName).parent.fsName + '/translate.command');
commandFile.execute();