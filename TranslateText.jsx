// Define text:
var textToTranslate = "Verify the command file is receiving arguments.";
// Write text to translate to a temp file:
var tempFile = new File("/tmp/translate_args.txt");
tempFile.open('w');
tempFile.write(textToTranslate);
tempFile.close();
// Execute command file from same directory:
// File($.fileName) gets object reference to the current script,
// then we get parent directory and append the command file name.
var commandFile = File(File($.fileName).parent.fsName + '/translate.command');
commandFile.execute()