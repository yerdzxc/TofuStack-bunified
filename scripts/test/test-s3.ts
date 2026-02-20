// Test S3 upload - supports any S3-compatible storage
console.log('🧪 Testing S3 upload...\n');

const ENDPOINT = process.env.STORAGE_HOST || 'localhost';
const PORT = process.env.STORAGE_PORT || 3900;
const REGION = process.env.STORAGE_REGION || 'auto';
const KEY_ID = process.env.STORAGE_ACCESS_KEY;
const SECRET = process.env.STORAGE_SECRET_KEY;
const BUCKET = process.env.STORAGE_BUCKET || 'dev';
const FORCE_PATH_STYLE = process.env.STORAGE_FORCE_PATH_STYLE !== 'false';

console.log('Config:', { ENDPOINT, PORT, REGION, BUCKET, FORCE_PATH_STYLE });

const { S3Client } = await import('bun');

const s3 = new S3Client({
	endpoint: ENDPOINT,
	port: PORT,
	accessKeyId: KEY_ID,
	secretAccessKey: SECRET,
	region: REGION,
	forcePathStyle: FORCE_PATH_STYLE
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
