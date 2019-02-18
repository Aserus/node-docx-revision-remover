const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const access = promisify(fs.access)

const convert = require('xml-js');


async function exists(file){
	try{
		await access(file);
	}catch(err){
		return false;
	}
	return true;
}

function arrChilds(list,tag){
	let out = [];
	list.forEach(item => {
		let l = findDescendants(item,tag,0)
		if(l.length) out.push(...l);
	})
	return out;
}

function findAncestor(node,tag){
	if(!node.parent) return null
	if(node.parent.name == tag) return node.parent;
	return findAncestor(node.parent,tag)
}
function findDescendant(el,tagOrList,maxLevel){
	let list = findDescendants(el,tagOrList,maxLevel,1);
	if(list.length) return list[0]
	return null;
}
function findDescendants(el,tagOrList,maxLevel,maxCount){
	let out = [];
	const tagList = new Set();

	if(typeof(tagOrList) == 'string'){
		tagList.add(tagOrList)
	}else if(tagOrList instanceof Array){
		tagOrList.forEach(t => tagList.add(t));
	}

	function findElement(node,level){
		if(out.length>= maxCount) return;
		if(node.type && node.type == 'element' && node.name && tagList.has(node.name)){
			out.push(node)
			return
		}
		if((typeof maxLevel == 'number') && (level+1) >= maxLevel) return;
		if(node.elements && node.elements.length){
			node.elements.forEach(item => findElement(item,level+1))
		}
	}
	if(el.elements && el.elements.length)	el.elements.forEach(item => findElement(item,0))
//	findElement(el,0)
	return out;
}

function getNodeIndex(node){
	for(let i in node.parent.elements){
		if(node.parent.elements[i] == node){
			return i
		}
	}
	return null;
}
function removeNodes(list){
	list.forEach(node => removeNode(node))
}
function removeNode(node){
	const i = getNodeIndex(node)
	node.parent.elements.splice(i,1);
	return true;
}

function findNext(node,tag){
	const currI = getNodeIndex(node)
	const elements = node.parent.elements;
	for(let i=currI+1; i<elements.length; i++ ){
		if(elements[i].name == tag)	return elements[i];
	}
	return null
}

function replaceWithNodes(list){
	list.forEach(node => {
		if(node.elements && node.elements.length){
			const currI = getNodeIndex(node);
			node.parent.elements.splice(currI,0,...node.elements)
		}
		removeNode(node)
	})
}


function acceptByBodypart(bodyPart){

	let list = findDescendants(bodyPart,'w:ins')
	replaceWithNodes(list)

	list = findDescendants(bodyPart,'w:p');
	list = arrChilds(list,'w:pPr')
	list = arrChilds(list,'w:rPr')
	list = arrChilds(list,'w:del')
	list.reverse();

	list.forEach(node => {
		const nodeP = findAncestor(node,'w:p')

		const nextNode = findNext(node,'w:p');

		if(nextNode && nextNode.elemets && nextNode.elements.length){
			if(!node.elements) node.elements = [];
			nextNode.elements.forEach(item => {
				node.elements.push(item)
			});
		}

		if(nextNode) removeNode(nextNode)
		removeNode(node)
	})

	let tagList = [
		"w:pPrChange",
		"w:rPrChange",
		"w:tblPrChange",
		"w:tblGridChange",
		"w:tcPrChange",
		"w:trPrChange",
		"w:tblPrExChange",
		"w:sectPrChange"
	];

	list = findDescendants(bodyPart,tagList);
	removeNodes(list)


	list = findDescendants(bodyPart,'w:tr');
	list = arrChilds(list,'w:trPr')
	list = arrChilds(list,'w:del')

	list.forEach(node => removeNode(node.parent.parent))


	list = findDescendants(bodyPart,'w:del');
	list.forEach(node => {
		let nodeP = findAncestor(node,'w:p')
		removeNode(node);
		let nodeR = findDescendant(nodeP,'w:r');
		if(!nodeR) removeNode(nodeP);
	})

	list = findDescendants(bodyPart,'w:tbl');
	list.forEach(node => {
		let childs = findDescendants(node,'w:tr',0);
		if(childs.length === 0)	removeNode(node)
	})

	list = findDescendants(bodyPart,'w:p');
	list = arrChilds(list,'w:moveFrom')
	list.forEach(node => {
		const nodeP = findAncestor(node,'w:p')
		if(nodeP)	removeNode(nodeP)
	})

	list = findDescendants(bodyPart,'w:moveFromRangeEnd');
	removeNodes(list)


	list = findDescendants(bodyPart,'w:p');
	list = arrChilds(list,'w:moveTo')
	replaceWithNodes(list)

	list = findDescendants(bodyPart,'w:moveToRangeStart');
	removeNodes(list)
	list = findDescendants(bodyPart,'w:moveToRangeEnd');
	removeNodes(list)


	list = findDescendants(bodyPart,'w:tc');
	list.forEach(node => {
		let childs = findDescendants(node,'w:p',0);
		if(childs.length === 0)	removeNode(node)
	})


}

module.exports = async folderDoc => {


	let fileList = ['document.xml','header1.xml','footer1.xml']



	for(let wfile of fileList){
		const workFile = path.join(folderDoc,'word/',wfile)
		let isExists = await exists(workFile)
		if(!isExists) continue;



		const xml = await readFile(workFile, 'utf8');

		//await writeFile(workFile+'.dst', xml, 'utf8');

		let jsonObj = convert.xml2js(xml, { addParent: true });
		//const bodyPart = findDescendant(jsonObj,'w:body');
		acceptByBodypart(jsonObj)
		let xmlEnd = convert.js2xml(jsonObj, {});
		await writeFile(workFile, xmlEnd, 'utf8');
	}
	return true;
}
