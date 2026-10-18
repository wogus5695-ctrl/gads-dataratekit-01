import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Core Utilities SSR / Initial HTML Visibility', () => {
  const serverAppDir = path.join(process.cwd(), '.next/server/app');

  it('Download Calculator (/) initial HTML renders inputs and default results without fallback loader', () => {
    const htmlPath = path.join(serverAppDir, 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'index.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Must NOT contain fallback loader
    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.strictEqual(html.includes('Loading converter...'), false, 'Must not contain Loading converter fallback');

    // Must contain H1, inputs and default calculation results
    assert.ok(html.includes('Download Time Calculator'), 'H1 title must be present');
    assert.ok(html.includes('Download Time'), 'Primary result label must be present');
    assert.ok(html.includes('2 hours 13 minutes 20 seconds'), 'Default 100 GB @ 100 Mbps result must be present in initial HTML');
    assert.ok(html.includes('12.5 MB/s'), 'Equivalent MB/s rate must be present in initial HTML');
  });

  it('Upload Calculator (/upload-time-calculator) initial HTML renders inputs and default results', () => {
    const htmlPath = path.join(serverAppDir, 'upload-time-calculator.html');
    assert.ok(fs.existsSync(htmlPath), 'upload-time-calculator.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.ok(html.includes('Upload Time Calculator'), 'H1 title must be present');
    assert.ok(html.includes('Upload Time'), 'Primary result label must be present');
    assert.ok(html.includes('11 hours 6 minutes 40 seconds'), 'Default 100 GB @ 20 Mbps result must be present in initial HTML');
  });

  it('File Transfer Calculator (/file-transfer-time-calculator) initial HTML renders inputs and default results', () => {
    const htmlPath = path.join(serverAppDir, 'file-transfer-time-calculator.html');
    assert.ok(fs.existsSync(htmlPath), 'file-transfer-time-calculator.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.ok(html.includes('File Transfer Time Calculator'), 'H1 title must be present');
    assert.ok(html.includes('File Transfer Time'), 'Primary result label must be present');
    assert.ok(html.includes('16 minutes 40 seconds'), 'Default 100 GB @ 100 MB/s result must be present in initial HTML');
  });

  it('Mbps to MB/s Converter (/mbps-to-mbs) initial HTML renders bidirectional inputs and defaults', () => {
    const htmlPath = path.join(serverAppDir, 'mbps-to-mbs.html');
    assert.ok(fs.existsSync(htmlPath), 'mbps-to-mbs.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading converter...'), false, 'Must not contain Loading converter fallback');
    assert.ok(html.includes('Mbps to MB/s Converter'), 'H1 title must be present');
    assert.ok(html.includes('Megabits per second'), 'Mbps label must be present');
    assert.ok(html.includes('Megabytes per second'), 'MB/s label must be present');
  });
});
