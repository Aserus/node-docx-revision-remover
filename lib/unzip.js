const fs = require('fs');
const unzipper = require('unzipper');
const tempdir = require('tempdir');


module.exports = async archive => {
	//const extractPath = await tempdir()
	const extractPath = '/Users/warus/Documents/testdoc/out'
	const end = new Promise((resolve,reject)=>{
		fs.createReadStream(archive).pipe(unzipper.Extract({ path: extractPath }))
			.on('finish',()=>resolve(true))
			.on('error',reject)
	})

	await end;
	return extractPath;
}
