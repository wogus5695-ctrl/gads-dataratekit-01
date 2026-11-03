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
    assert.ok(html.includes('Estimated Download Time'), 'Primary result label must be present');
    assert.ok(html.includes('2 hours 28 minutes 9 seconds'), 'Default 100 GB @ 100 Mbps (90% planning) result must be present in initial HTML');
    assert.ok(html.includes('2 hours 13 minutes 20 seconds'), 'Theoretical line-rate duration must be present in initial HTML');
    assert.ok(html.includes('11.25 MB/s'), 'Effective MB/s rate must be present in initial HTML');
  });

  it('Upload Calculator (/upload-time-calculator) initial HTML renders inputs and default results', () => {
    const htmlPath = path.join(serverAppDir, 'upload-time-calculator.html');
    assert.ok(fs.existsSync(htmlPath), 'upload-time-calculator.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.ok(html.includes('Upload Time Calculator'), 'H1 title must be present');
    assert.ok(html.includes('Estimated Upload Time'), 'Primary result label must be present');
    assert.ok(html.includes('1 hour 6 minutes 40 seconds'), 'Default 10 GB @ 20 Mbps result must be present in initial HTML');
    assert.ok(html.includes('20 Mbps'), 'Effective speed must be present in initial HTML');
  });

  it('File Transfer Calculator (/file-transfer-time-calculator) initial HTML renders inputs and default results', () => {
    const htmlPath = path.join(serverAppDir, 'file-transfer-time-calculator.html');
    assert.ok(fs.existsSync(htmlPath), 'file-transfer-time-calculator.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.ok(html.includes('File Transfer Time Calculator'), 'H1 title must be present');
    assert.ok(html.includes('Estimated Transfer Duration'), 'Primary result label must be present');
    assert.ok(html.includes('15 minutes 41 seconds'), 'Default 100 GB multi-stage result must be present in initial HTML');
    assert.ok(html.includes('Interface / Network'), 'Bottleneck stage must be present in initial HTML');
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

  it('Video File Size Calculator (/video-file-size-calculator) initial HTML renders inputs and default results', () => {
    const htmlPath = path.join(serverAppDir, 'video-file-size-calculator.html');
    assert.ok(fs.existsSync(htmlPath), 'video-file-size-calculator.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.ok(html.includes('Video File Size Calculator'), 'H1 title must be present');
    assert.ok(html.includes('Estimated File Size'), 'Primary result label must be present');
    assert.ok(html.includes('9.144 GB'), 'Default 20 Mbps + 320 kbps 1h result must be present in initial HTML');
    assert.ok(html.includes('20.32 Mbps'), 'Total combined bitrate must be present in initial HTML');
  });

  it('Internet Data Usage Calculator (/data-usage-calculator) initial HTML renders inputs and default results', () => {
    const htmlPath = path.join(serverAppDir, 'data-usage-calculator.html');
    assert.ok(fs.existsSync(htmlPath), 'data-usage-calculator.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.strictEqual(html.includes('Loading calculator...'), false, 'Must not contain Loading calculator fallback');
    assert.ok(html.includes('Internet Data Usage Calculator'), 'H1 title must be present');
    assert.ok(html.includes('Day Period Usage'), 'Primary result label must be present');
    assert.ok(html.includes('83.16 GB'), 'Default 30-day usage result must be present in initial HTML');
    assert.ok(html.includes('Video stream'), 'Default video activity must be present');
    assert.ok(html.includes('Audio stream'), 'Default audio activity must be present');
  });

  it('Calculation Methodology (/methodology) initial HTML renders H1, links to all 6 tools, and core standards', () => {
    const htmlPath = path.join(serverAppDir, 'methodology.html');
    assert.ok(fs.existsSync(htmlPath), 'methodology.html must exist after build');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Must NOT contain fallback loader or error
    assert.strictEqual(html.includes('Loading...'), false, 'Must not contain Loading... fallback');
    assert.strictEqual(html.includes('Application error'), false, 'Must not contain Application error');
    assert.strictEqual(html.includes('client-side exception'), false, 'Must not contain client-side exception');

    // Must contain H1
    assert.ok(html.includes('Calculation Methodology'), 'H1 title must be present');

    // Must contain links to all 6 Core Calculators
    assert.ok(html.includes('href="/"'), 'Must link to Download Calculator');
    assert.ok(html.includes('href="/upload-time-calculator"'), 'Must link to Upload Calculator');
    assert.ok(html.includes('href="/file-transfer-time-calculator"'), 'Must link to File Transfer Calculator');
    assert.ok(html.includes('href="/mbps-to-mbs"'), 'Must link to Mbps to MB/s Converter');
    assert.ok(html.includes('href="/video-file-size-calculator"'), 'Must link to Video Calculator');
    assert.ok(html.includes('href="/data-usage-calculator"'), 'Must link to Data Usage Calculator');

    // Must contain core section headings
    assert.ok(html.includes('Core Unit Conventions'), 'Must include Core Unit Conventions heading');
    assert.ok(html.includes('Download Calculation Model'), 'Must include Download Calculation Model heading');
    assert.ok(html.includes('Upload Planning Model'), 'Must include Upload Planning Model heading');
    assert.ok(html.includes('File Transfer Bottleneck Model'), 'Must include File Transfer Bottleneck Model heading');
    assert.ok(html.includes('Mbps ↔ MB/s Conversion Model') || html.includes('Mbps &harr; MB/s Conversion Model'), 'Must include Mbps Conversion Model heading');
    assert.ok(html.includes('Video File Size Model'), 'Must include Video Model heading');
    assert.ok(html.includes('Internet Data Usage Model'), 'Must include Data Usage Model heading');
    assert.ok(html.includes('Practical Limitations') && html.includes('Environmental Variance'), 'Must include Limitations heading');
    assert.ok(html.includes('Automated Testing') && html.includes('Verification Policy'), 'Must include Testing heading');
  });
});
