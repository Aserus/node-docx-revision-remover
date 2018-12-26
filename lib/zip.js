const fs = require('fs');
const unzipper = require('unzipper');
const tempdir = require('tempdir');

const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const archiver = require('archiver');


function archiveFolder(folderPath,distPath){
	return new Promise((resolve,reject) => {

		// create a file to stream archive data to.
		const output = fs.createWriteStream(distPath);
		const archive = archiver('zip', {
		  //zlib: { level: 9 } // Sets the compression level.
		});

		// listen for all archive data to be written
		// 'close' event is fired only when a file descriptor is involved
		output.on('close', () => {
			resolve(distPath)
		});

		// This event is fired when the data source is drained no matter what was the data source.
		// It is not part of this library but rather from the NodeJS Stream API.
		// @see: https://nodejs.org/api/stream.html#stream_event_end
		output.on('end', () => {
		  console.log('Data has been drained');
		});

		archive.on('warning', err => {
		  if (err.code === 'ENOENT') {
		    console.log(err)
		  } else {
		    throw err;
		  }
		});

		archive.on('error', reject);

		archive.pipe(output);
		archive.directory(folderPath, false)

		archive.finalize();
	})
}


module.exports = async (folderPath,distPath,needRemove) => {

	await archiveFolder(folderPath,distPath);
	if(needRemove){
		await rimraf(folderPath);
	}


	return distPath;

}
