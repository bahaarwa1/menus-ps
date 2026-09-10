const http = require('http');

const TARGET_URL = process.env.LOAD_TEST_URL || 'http://localhost:3000/api/v1/menu';
const agent = new http.Agent({ keepAlive: true, maxSockets: 200 });

function singleRequest(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(url, { agent }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve({
          duration: Date.now() - start,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          cached: res.headers['x-cache'] === 'HIT',
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        duration: Date.now() - start,
        status: 0,
        success: false,
        error: err.message,
      });
    });
  });
}

async function runBatch(concurrency) {
  console.log(`\n==============================================`);
  console.log(`🚀 Starting Concurrency Benchmark: ${concurrency} Requests`);
  console.log(`==============================================`);

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < concurrency; i++) {
    promises.push(singleRequest(TARGET_URL));
  }

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;
  const cachedHits = results.filter((r) => r.cached).length;
  const durations = results.map((r) => r.duration).sort((a, b) => a - b);

  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);
  const rps = ((concurrency / totalDuration) * 1000).toFixed(0);
  const successRate = ((successful / concurrency) * 100).toFixed(1);
  const cacheHitRate = ((cachedHits / successful) * 100).toFixed(1);

  console.log(`⏱️  Total Duration:     ${totalDuration} ms`);
  console.log(`⚡ Throughput (RPS):    ${rps} requests/sec`);
  console.log(`✅ Success Rate:        ${successRate}% (${successful}/${concurrency})`);
  console.log(`💾 Cache Hit Ratio:     ${cacheHitRate}% (${cachedHits}/${successful})`);
  console.log(`📊 Latency Percentiles:`);
  console.log(`   - Average:           ${avg} ms`);
  console.log(`   - P50 (Median):      ${p50} ms`);
  console.log(`   - P95:               ${p95} ms`);
  console.log(`   - P99:               ${p99} ms`);

  return {
    concurrency,
    totalDuration,
    rps: Number(rps),
    successRate: Number(successRate),
    p50,
    p95,
    p99,
  };
}

async function main() {
  console.log('--- Menus.ps High-Traffic Scalability Verification ---');
  console.log(`Target: ${TARGET_URL}\n`);

  // Warm-up cache with 1 request
  await singleRequest(TARGET_URL);

  const r100 = await runBatch(100);
  const r500 = await runBatch(500);
  const r1000 = await runBatch(1000);

  console.log('\n==============================================');
  console.log('🏆 FINAL SCALABILITY BENCHMARK SUMMARY');
  console.log('==============================================');
  console.table([
    { 'Concurrent Users': 100, 'RPS': r100.rps, 'P50 (ms)': r100.p50, 'P95 (ms)': r100.p95, 'Success Rate': `${r100.successRate}%` },
    { 'Concurrent Users': 500, 'RPS': r500.rps, 'P50 (ms)': r500.p50, 'P95 (ms)': r500.p95, 'Success Rate': `${r500.successRate}%` },
    { 'Concurrent Users': 1000, 'RPS': r1000.rps, 'P50 (ms)': r1000.p50, 'P95 (ms)': r1000.p95, 'Success Rate': `${r1000.successRate}%` },
  ]);

  if (r1000.successRate < 95) {
    console.error('Benchmark failed: Success rate below 95% under 1,000 load!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
