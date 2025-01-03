// Send text to command file as argument:
var textToTranslate = "Hello world";
var commandFile = File(File($.fileName).parent.fsName + '/translate.command');
commandFile.execute('"' + textToTranslate + '"');