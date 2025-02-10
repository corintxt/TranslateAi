//
// EditCaption.jsx
// Version 2.1 2014-10-06
//
var debug=false;
var sourceDoc;
var sVal ;
var tVal;

if(documents.length > 0)
{
    sourceDoc = activeDocument;

	// load the XMP library
	ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
	var xmp = new XMPMeta(activeDocument.XMPString);

	var res =
	"dialog { \
		info: Panel { orientation: 'column', alignChildren:'right', \
			text: 'Caption',\
			DT: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Date :' }, \
				e: EditText { characters: 60 } \
			}, \
			HDL: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Headline :' }, \
				e: EditText { characters: 60 } \
			}, \
			CPT: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:' Caption :'}, \
				e: EditText { characters: 60 } \
			}, \
			OBJ_NM: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Object Name :' }, \
				e: EditText { characters: 60 } \
			}, \
			CAT: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'CAT :' }, \
				e: EditText { characters: 60 } \
			}, \
			SPCI: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Special Ins. :' }, \
				e: EditText { characters: 60 } \
			}, \
			SRC: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Source :' }, \
				e: EditText { characters: 60 } \
			}, \
			CNTRY_COD: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Country code :' }, \
				e: EditText { characters: 60 } \
			}, \
			CNTRY: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Country :' }, \
				e: EditText { characters: 60 } \
			}, \
			BYLN: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Byline :' }, \
				e: EditText { characters: 60 } \
			}, \
			CPTWR: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Writer :' }, \
				e: EditText { characters: 60 } \
			}, \
			KWDS: Group { orientation: 'row', alignChildren:'right',\
				s: StaticText { text:'Keywords :' }, \
				e: EditText { characters: 60 } \
			}, \		}, \
		buttons: Group { orientation: 'row', \
			okBtn: Button { text:'OK', properties:{name:'ok'} }, \
			cancelBtn: Button { text:'Cancel', properties:{name:'cancel'} } \
		} \
	}";
	win = new Window (res);
	win.info.text = localize ({ en: "XMP fields", fr: "Champs XMP", de: "XMP fields", es: "XMP fields", pt: "XMP fields" });
	win.info.DT.s.text = localize ({ en: "Date", fr: "Date", de: "Date", es: "Fecha", pt: "Date" }) + " :";
	win.info.OBJ_NM.s.text = localize ({ en: "Unique Identifier", fr: "Identifiant Unique", de: "Unique Identifier", es: "Unique Identifier", pt: "Unique Identifier" }) + " :";
	win.info.SRC.s.text = localize ({ en: "Source", fr: "Source", de: "Source", es: "Source", pt: "Source" }) + " :";
	win.info.HDL.s.text = localize ({ en: "Title", fr: "Titre", de: "Title", es: "Título", pt: "Title" }) + " :";
	win.info.CPT.s.text = localize ({ en: "Caption", fr: "Légende", de: "Caption", es: "Leyenda", pt: "Caption" }) + " :";
	win.info.CAT.s.text = localize ({ en: "Category", fr: "Catégorie", de: "Category", es: "Categoría", pt: "Category" }) + " :";
	win.info.SPCI.s.text = localize ({ en: "Special Ins.", fr: "Instructions spéciales", de: "Special Ins.", es: "Instrucciones especiales", pt: "Special Ins." }) + " :";
	win.info.CNTRY_COD.s.text = localize ({ en: "Country code", fr: "Code Pays", de: "Country code", es: "Código de país", pt: "Country code" }) + " :";
	win.info.CNTRY.s.text = localize ({ en: "Country", fr: "Pays", de: "Country", es: "País", pt: "Country" }) + " :";
	win.info.BYLN.s.text = localize ({ en: "Graphist", fr: "Graphiste", de: "Graphist", es: "Grafista", pt: "Graphist" }) + " :";
	win.info.CPTWR.s.text = localize ({ en: "Editor", fr: "Editeur", de: "Editor", es: "Editor", pt: "Editor" }) + " :";
	win.info.KWDS.s.text = localize ({ en: "Keywords", fr: "Mots-Clés", de: "Stichwort", es: "Palabra clave", pt: "Palavra-chave" }) + " :";
	
	var iCount, sText;
	var xmpProp;

	iCount= xmp.countArrayItems(XMPConst.NS_DC, "creator")
	if (iCount>0){
		win.info.BYLN.e.text  = xmp.getArrayItem(XMPConst.NS_DC, "creator", 1);
	}

	iCount= xmp.countArrayItems(XMPConst.NS_DC, "description")
	if (iCount>0){
		xmpProp = xmp.getArrayItem(XMPConst.NS_DC, "description", 1);
		if ( xmpProp != null ){
			win.info.CPT.e.text  = utf8totext(xmpProp.value);
		}
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "CaptionWriter", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.CPTWR.e.text = utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "Category", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.CAT.e.text = utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_IPTC_CORE, "CountryCode", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.CNTRY_COD.e.text = utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "Country", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.CNTRY.e.text =utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "Credit", XMPConst.STRING);
	if ( xmpProp != null ){
		sText =utf8totext(xmpProp.value);
	}

	var xmpDT = new XMPDateTime();
	var DT = new Date();
	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "DateCreated", XMPConst.XMPDATE);
	if ( xmpProp != null ){
		try{
			xmpDT = xmpProp.value;
			 DT  = xmpDT.getDate();
		}catch(e){
			 DT = new Date();
		}
	}
	var sMonth;
	switch ( DT.getMonth() ){
		case 0:
			sMonth = localize ({ en: "January", fr: "janvier", de: "Januar", es: "enero", pt: "janeiro" }); break;
		case 1:
			sMonth = localize ({ en: "February", fr: "février", de: "Februar", es: "febrero", pt: "fevereiro" }); break;
		case 2:
			sMonth = localize ({ en: "March", fr: "mars", de: "März", es: "marzo", pt: "março" }); break;
		case 3:
			sMonth = localize ({ en: "April", fr: "avril", de: "April", es: "abril", pt: "abril" }); break;
		case 4:
			sMonth = localize ({ en: "May", fr: "mai", de: "Mai", es: "mayo", pt: "maio" }); break;
		case 5:
			sMonth = localize ({ en: "June", fr: "juin", de: "Juni", es: "junio", pt: "junho" }); break;
		case 6:
			sMonth = localize ({ en: "July", fr: "juillet", de: "juli", es: "julio", pt: "julho" }); break;
		case 7:
			sMonth = localize ({ en: "August", fr: "août", de: "August", es: "agosto", pt: "agosto" }); break;
		case 8:
			sMonth = localize ({ en: "September", fr: "septembre", de: "September", es: "septiembre", pt: "setembro" }); break;
		case 9:
			sMonth = localize ({ en: "October", fr: "octobre", de: "Oktober", es: "octubre", pt: "outubro" }); break;
		case 10:
			sMonth = localize ({ en: "November", fr: "novembre", de: "November", es: "noviembre", pt: "novembro" }); break;
		case 11:
			sMonth = localize ({ en: "December", fr: "décembre", de: "December", es: "diciembre", pt: "dezembro" }); break;
	}

	win.info.DT.e.text = DT.getDate() + " " + sMonth + " " + DT.getFullYear();

	xmpProp = xmp.getProperty(XMPConst.NS_DC, "identifier", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.OBJ_NM.e.text =utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "Headline", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.HDL.e.text = utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "TransmissionReference", XMPConst.STRING);
	if ( xmpProp != null ){
		sText =utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "Instructions", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.SPCI.e.text =utf8totext(xmpProp.value);
	}

	xmpProp = xmp.getProperty(XMPConst.NS_PHOTOSHOP, "Source", XMPConst.STRING);
	if ( xmpProp != null ){
		win.info.SRC.e.text =utf8totext(xmpProp.value);
	}

	iCount= xmp.countArrayItems(XMPConst.NS_DC, "subject")
	if (iCount>0){
		win.info.KWDS.e.text  = xmp.getArrayItem(XMPConst.NS_DC, "subject", 1);
		for ( i=1; i<iCount; i++) win.info.KWDS.e.text  = win.info.KWDS.e.text + ',' + xmp.getArrayItem(XMPConst.NS_DC, "subject", i+1);
	}

	win.center();
	res = win.show();
	if (debug) $.writeln(res);
	if ( res == 1 ){
		if (debug) $.writeln(win.info.FILE.e.text );

		var sVal = win.info.OBJ_NM.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_DC, "identifier", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_DC, "identifier");
		}		
	
		while ( xmp.countArrayItems(XMPConst.NS_DC, "creator") > 0 ) xmp.deleteArrayItem(XMPConst.NS_DC, "creator", XMPConst.ARRAY_LAST_ITEM);
		xmp.deleteProperty(XMPConst.NS_DC, "creator");
		if ( win.info.BYLN.e.text != "" ){
			xmp.appendArrayItem(XMPConst.NS_DC, "creator", win.info.BYLN.e.text,0,XMPConst.ARRAY_IS_ORDERED);
		}
	
		while ( xmp.countArrayItems(XMPConst.NS_DC, "description") > 0 ) xmp.deleteArrayItem(XMPConst.NS_DC, "description", XMPConst.ARRAY_LAST_ITEM);
		xmp.deleteProperty(XMPConst.NS_DC, "description");
		if ( win.info.CPT.e.text != "" ){
			xmp.appendArrayItem(XMPConst.NS_DC, "description", win.info.CPT.e.text,0,XMPConst.ARRAY_IS_ORDERED);
		}
	
		var sVal = win.info.HDL.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "Headline", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "Headline");
		}

		sVal = win.info.CAT.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "Category", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "Category");
		}
	
		var sdt  = win.info.DT.e.text;
		sdt = srtAccentRemove(sdt);
		sdt = sdt.toLowerCase() ;
		sdt=sdt.replace(/jan[a-z]*/, "jan");sdt=sdt.replace(/ene[a-z]*/, "jan");
		sdt=sdt.replace(/feb[a-z]*/, "feb");sdt=sdt.replace(/fev[a-z]*/, "feb");
		sdt=sdt.replace(/mar[a-z]*/, "mar");
		sdt=sdt.replace(/apr[a-z]*/, "apr");sdt=sdt.replace(/avr[a-z]*/, "apr");sdt=sdt.replace(/abr[a-z]*/, "apr");
		sdt=sdt.replace(/may[a-z]*/, "may");sdt=sdt.replace(/mai[a-z]*/, "may");
		sdt=sdt.replace(/jun[a-z]*/, "jun ");sdt=sdt.replace("juin", "jun");
		sdt=sdt.replace(/jul[a-z]*/, "jul ");sdt=sdt.replace(/juil[a-z]*/, "jul ");
		sdt=sdt.replace(/aug[a-z]*/, "aug ");sdt=sdt.replace(/aou[a-z]*/, "aug ");sdt=sdt.replace(/ago[a-z]*/, "aug ");
		sdt=sdt.replace(/sep[a-z]*/, "sep");
		sdt=sdt.replace(/oct[a-z]*/, "oct");
		sdt=sdt.replace(/nov[a-z]*/, "nov");
		sdt=sdt.replace(/dec[a-z]*/, "dec");sdt=sdt.replace(/dic[a-z]*/, "dec");
		sdt=sdt.replace(".","");
		try{
			var dt = new Date(sdt);
			var xmpDT = new XMPDateTime(dt);
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "DateCreated", xmpDT, 0, XMPConst.XMPDATE);
		}catch(e){
			var dt = new Date();
			var xmpDT = new XMPDateTime(dt);
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "DateCreated", xmpDT, 0, XMPConst.XMPDATE);
		}
	
		sVal = win.info.CNTRY.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "Country", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "Country");
		}
		
		sVal = win.info.CPTWR.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "CaptionWriter", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "CaptionWriter");
		}
	
		sVal = win.info.SPCI.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "Instructions", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "Instructions");
		}
	
		xmp.setProperty(XMPConst.NS_PHOTOSHOP, "Credit", "AFP", 0, XMPConst.STRING);
		
		sVal = win.info.SRC.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_PHOTOSHOP, "Source", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_PHOTOSHOP, "Source");
		}
		
		sVal = win.info.CNTRY_COD.e.text;
		if ( sVal != "" ){
			xmp.setProperty(XMPConst.NS_IPTC_CORE, "CountryCode", sVal, 0, XMPConst.STRING);
		}else{
			xmp.deleteProperty(XMPConst.NS_IPTC_CORE, "CountryCode");
		}
	
		sVal = win.info.KWDS.e.text;
		tVal = sVal.split(",");
		xmp.deleteProperty(XMPConst.NS_DC, "subject");
		if ( tVal.length > 0 ){
			for ( i=0; i<tVal.length; i++)xmp.appendArrayItem(XMPConst.NS_DC, "subject", tVal[i], 0, XMPConst.PROP_IS_ARRAY);
		}
		
		activeDocument.XMPString = xmp.serialize(XMPConst.SERIALIZE_USE_COMPACT_FORMAT);
		activeDocument.saved=false;
	}
	ExternalObject.AdobeXMPScript.unload(); // Unload le XMP library
 }

function fillRightZero(v)
{
	v = '00' + v;
	
	return v.substr(v.length - 2, 2);
}

function srtAccentRemove(Str){
	var newStr = "";
	var newStr2 ="";
    
	for (i=0; i< Str.length; i++){
		var iCharCode = Str.charCodeAt(i);
		var sChar = Str.charAt(i);
       switch (iCharCode) {
		// à á â ã ä
 		case 224: case 225: case 226: case 227: case 228:
            sChar = 'a';
            break;
		// é è ê ë
         case 233: case 232: case 234: case 235:
            sChar = 'e';
            break;
		// ù ú û ü
        case 249: case 250: case 251: case 252: 
            sChar = 'u';
            break;
        }
		newStr += sChar;
		newStr2 += iCharCode + " ";
	}
	//alert(Str + " " + newStr + " " + newStr2);
   return newStr;
}


function utf8totext(utftext) 
{
    if ( parseFloat(this.app.version) >= 15 ) return utftext;

	var string = "";
	var i = 0;
	var c = c1 = c2 = 0;

	while ( i < utftext.length ) {

		c = utftext.charCodeAt(i);

		if (c < 128) {
			string += String.fromCharCode(c);
			i++;
		}
		else if((c > 191) && (c < 224)) {
			c2 = utftext.charCodeAt(i+1);
			string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		}
		else {
			c2 = utftext.charCodeAt(i+1);
			c3 = utftext.charCodeAt(i+2);
			string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}

	}

	return string;
}
