#!/usr/bin/env node
// Encrypts game.html with PBKDF2-derived AES-256-GCM key and bakes
// the ciphertext into template.html → index.html.
//
// Usage: node build.js
// Override password: PASSWORD=otherpassword node build.js

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const PASSWORD = process.env.PASSWORD;
if (!PASSWORD) {
  console.error('Set PASSWORD env var, e.g.  PASSWORD=yoursecret node build.js');
  process.exit(1);
}
const ITER = 200000;
const DIR = __dirname;

const game = fs.readFileSync(path.join(DIR, 'game.html'), 'utf8');
const template = fs.readFileSync(path.join(DIR, 'template.html'), 'utf8');

const salt = crypto.randomBytes(16);
const iv   = crypto.randomBytes(12);
const key  = crypto.pbkdf2Sync(PASSWORD, salt, ITER, 32, 'sha256');

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct  = Buffer.concat([cipher.update(game, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag(); // 16 bytes

// Layout: salt(16) || iv(12) || tag(16) || ciphertext
const blob = Buffer.concat([salt, iv, tag, ct]).toString('base64');

const out = template.replace('__BLOB__', blob);
fs.writeFileSync(path.join(DIR, 'index.html'), out);

console.log(`✓ Built index.html`);
console.log(`  password : ${PASSWORD}`);
console.log(`  game size: ${game.length} chars → ciphertext ${ct.length} bytes`);
console.log(`  output   : ${out.length} chars`);
