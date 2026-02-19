// Test Garage S3 upload - matches actual storage.service.ts
console.log('🧪 Testing Garage S3 upload...\n');

const KEY_ID = process.env.STORAGE_ACCESS_KEY;
const SECRET = process.env.STORAGE_SECRET_KEY;
const ENDPOINT = `http://${process.env.STORAGE_HOST}:${process.env.STORAGE_PORT}`;
const BUCKET = process.env.STORAGE_BUCKET || 'dev';

console.log('Config:', { ENDPOINT, BUCKET });

const { S3Client } = await import('bun');

const s3 = new S3Client({
	endpoint: ENDPOINT,
	accessKeyId: KEY_ID,
	secretAccessKey: SECRET,
	region: 'garage',
	forcePathStyle: true
});

const testKey = 'test-' + Date.now() + '.txt';
const testContent = 'Hello from TofuStack!';

try {
	// Upload - using Bun's S3Client.write() like storage.service.ts
	console.log(`   Uploading ${testKey}...`);
	await s3.write(`s3://${BUCKET}/${testKey}`, testContent, {
		contentType: 'text/plain'
	});
	console.log(`   ✅ Upload successful!`);

	// Download
	console.log(`   Downloading ${testKey}...`);
	const file = s3.file(`s3://${BUCKET}/${testKey}`);
	const downloaded = await file.text();
	console.log(`   Downloaded: ${downloaded}`);

	// Delete
	console.log(`   Deleting ${testKey}...`);
	await s3.unlink(`s3://${BUCKET}/${testKey}`);
	console.log(`   ✅ Deleted!`);

	console.log(`\n✅ Garage S3 upload working!`);
} catch (e) {
	console.log(`   ❌ Error: ${e.message}`);
}
