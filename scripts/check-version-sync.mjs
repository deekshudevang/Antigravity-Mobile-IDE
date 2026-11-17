import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const pkgVersion = pkg.version;

const gradle = fs.readFileSync('android/app/build.gradle.kts', 'utf8');
const gradleMatch = gradle.match(/versionName\s*=\s*"([^"]+)"/);
const gradleVersion = gradleMatch ? gradleMatch[1] : null;

const cargo = fs.readFileSync('rust-helper/Cargo.toml', 'utf8');
const cargoMatch = cargo.match(/^version\s*=\s*"([^"]+)"/m);
const cargoVersion = cargoMatch ? cargoMatch[1] : null;

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const changelogMatch = changelog.match(/## \[([^\]]+)\]/);
const changelogVersion = changelogMatch ? changelogMatch[1] : null;

console.log('Version Synchronization Check:');
console.log(`- package.json:              ${pkgVersion}`);
console.log(`- android build.gradle.kts:  ${gradleVersion}`);
console.log(`- rust-helper Cargo.toml:    ${cargoVersion}`);
console.log(`- CHANGELOG.md latest:       ${changelogVersion}`);

let mismatch = false;
if (gradleVersion && gradleVersion !== pkgVersion) {
  console.error(`Mismatch: android versionName (${gradleVersion}) != package.json (${pkgVersion})`);
  mismatch = true;
}
if (cargoVersion && cargoVersion !== pkgVersion) {
  console.error(`Mismatch: cargo version (${cargoVersion}) != package.json (${pkgVersion})`);
  mismatch = true;
}
if (changelogVersion && changelogVersion !== pkgVersion) {
  console.error(`Mismatch: changelog latest version (${changelogVersion}) != package.json (${pkgVersion})`);
  mismatch = true;
}

if (mismatch) {
  console.error('FAIL: Version mismatch detected.');
  process.exit(1);
} else {
  console.log('PASS: All component versions are synchronized.');
}
