import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const packageDir = path.join(rootDir, 'package');
const rootPackagePath = path.join(rootDir, 'package.json');
const packageJsonPath = path.join(packageDir, 'package.json');

const preservedPackageFiles = new Set(['package.json', 'README.md', 'LICENSE']);

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, '\t')}\n`);
}

function copyRecursive(source, destination) {
	const stats = fs.statSync(source);
	if (stats.isDirectory()) {
		fs.mkdirSync(destination, { recursive: true });
		for (const item of fs.readdirSync(source)) {
			copyRecursive(path.join(source, item), path.join(destination, item));
		}
		return;
	}

	fs.copyFileSync(source, destination);
}

if (!fs.existsSync(distDir)) {
	throw new Error('dist/ does not exist. Run npm run build before preparing the package.');
}

const rootPackage = readJson(rootPackagePath);
const packageJson = readJson(packageJsonPath);

if (rootPackage.name !== packageJson.name) {
	throw new Error(`Package names differ: ${rootPackage.name} !== ${packageJson.name}`);
}

for (const item of fs.readdirSync(packageDir)) {
	if (!preservedPackageFiles.has(item)) {
		fs.rmSync(path.join(packageDir, item), { recursive: true, force: true });
	}
}

for (const item of fs.readdirSync(distDir)) {
	copyRecursive(path.join(distDir, item), path.join(packageDir, item));
}

packageJson.version = rootPackage.version;
packageJson.files = fs.readdirSync(packageDir)
	.filter(item => !preservedPackageFiles.has(item))
	.sort();

writeJson(packageJsonPath, packageJson);

console.log(`Prepared ${packageJson.name}@${packageJson.version} in package/`);
