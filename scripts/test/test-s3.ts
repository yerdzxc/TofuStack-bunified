// Test Garage S3 with real credentials
console.log('🧪 Testing Garage S3 with real credentials...\n');

const KEY_ID = 'GKae8b45e0b9dd3d00e9621824';
const SECRET = 'f7835124cd9fd29f7b389cb15fac938c5b067508a91a07b1c77d0771ae4756bc';

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import('bun');

const s3 = new S3Client({
	endpoint: 'http://localhost:3900',
	accessKeyId: KEY_ID,
	secretAccessKey: SECRET,
	region: 'garage',
	forcePathStyle: true
});

const bucket = 'dev';
const testKey = 'test-' + Date.now() + '.txt';
const testContent = 'Hello from TofuStack!';

try {
	// Upload test file
	console.log(`   Uploading ${testKey}...`);
	const uploadCmd = new PutObjectCommand({
		Bucket: bucket,
		Key: testKey,
		Body: testContent,
		ContentType: 'text/plain'
	});

	await s3.send(uploadCmd);
	console.log(`   ✅ Upload successful!`);

	// Download to verify
	console.log(`   Downloading ${testKey}...`);
	const getCmd = new GetObjectCommand({
		Bucket: bucket,
		Key: testKey
	});
	const response = await s3.send(getCmd);
	const downloaded = await response.text();
	console.log(`   Downloaded: ${downloaded}`);

	// Delete
	console.log(`   Deleting ${testKey}...`);
	const deleteCmd = new DeleteObjectCommand({
		Bucket: bucket,
		Key: testKey
	});
	await s3.send(deleteCmd);
	console.log(`   ✅ Deleted!`);

	console.log(`\n✅ Garage S3 fully working!`);
} catch (e) {
	console.log(`   ❌ Error: ${e.message}`);
	console.log(e.stack);
}
