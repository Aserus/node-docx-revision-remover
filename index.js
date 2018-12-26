const path = require('path');

const unzip = require('./lib/unzip');
const zip = require('./lib/zip');
const clearing = require('./lib/clearing');
const tempfile = require('tempfile');



module.exports = async (docx, outdoc) => {
	if(!outdoc) outdoc = tempfile('.docx')
	const outPath = await unzip(docx);
	await clearing(outPath)
	await zip(outPath,outdoc);
	return outdoc;
}
