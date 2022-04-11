import {loadFromChain} from "./chainload.js";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const tokenType = urlParams.get('m');
const tokenId = urlParams.get('t');

var namePromise = loadFromChain(tokenType, tokenId);
namePromise.then((info) => {
	var collectionName = info.collection_name;
	var uri = info.uri;
	var tokenId = info.id;
	var metaData = info['meta_data'];
	var name = metaData.name;
	var attributes = metaData.attributes;
	var attributeList = "<ul>";
	attributes.forEach(element => {
		var key = element['trait_type'] || element['display_type'];
		var value = element.value;
		attributeList += "<li>"+ key + ": " + value +"</li>";
	});
	attributeList += "</ul>";
	document.getElementById("nft_data").innerHTML = name +" (#"+tokenId+")"+ " from " + collectionName + ": " + uri + attributeList;
});
