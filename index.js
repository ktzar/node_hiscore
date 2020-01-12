const express = require('express');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

const app = express();
const port = 8080;

const MAX_SCORES = 10;
const DB_FILENAME = 'hiscores.json';
const BUCKET_NAME = 'cajon-desastre';

const storage = new Storage();

app.get('/', (req, res) => {
	downloadFile().then(scores => {
		const name = req.query.name;
		const score = parseInt(req.query.score);

		if (name && name.length > 2 && score > 0) {
			const existingScore = scores.findIndex(score => score.name === name);
			if (existingScore !== -1) {
				scores[existingScore].score = Math.max(
					score,
					scores[existingScore].score
				);
			} else {
				scores.push({name, score});	
				scores.sort((a,b) => b.score - a.score);
			}
		}
		res.send(scores.slice(0,MAX_SCORES));
		uploadFile(scores).then(() => console.log('file updated'));
	});
});

app.listen(port, () => console.log(`Listening at ${port}`));

async function uploadFile(scores) {
	fs.writeFileSync(DB_FILENAME, JSON.stringify(scores));
	await storage.bucket(BUCKET_NAME).upload(DB_FILENAME);
}

async function downloadFile() {
	const options = {
		destination: DB_FILENAME,
	};
	await storage
		.bucket(BUCKET_NAME)
		.file(DB_FILENAME)
		.download(options);
	//console.log( `gs://${BUCKET_NAME}/${srcFilename} downloaded to ${destFilename}.`);
	return JSON.parse(fs.readFileSync('./hiscores.json'));
}

