/**
 * AI Service Integration Test
 * ─────────────────────────────
 * Run from backend folder:  node tests/test_ai.js
 *
 * Requires both servers running:
 *   Backend  → npm run dev        (port 8000)
 *   AI       → uvicorn src.main:app --port 8001
 *
 * Set your test account credentials below — any valid account works.
 */

const AI_URL      = 'http://localhost:8001';
const BACKEND_URL = 'http://localhost:8000/api/v1';

// ── PUT YOUR LOGIN CREDENTIALS HERE ────────────────────────────────────────
const TEST_EMAIL    = 'tejasmishra040907@gmail.com';
const TEST_PASSWORD = 'Tejas#04';
// ───────────────────────────────────────────────────────────────────────────

let TOKEN = '';
let headers = { 'Content-Type': 'application/json' };

let passed = 0, failed = 0;

async function test(name, fn) {
  process.stdout.write(`\n🧪 ${name}... `);
  try {
    const result = await fn();
    console.log('✅ PASSED');
    passed++;
    const lines = JSON.stringify(result, null, 2).split('\n');
    lines.slice(0, 12).forEach(l => console.log('   ' + l));
    if (lines.length > 12) console.log(`   ... (${lines.length - 12} more lines)`);
    return result;
  } catch (e) {
    console.log('❌ FAILED');
    failed++;
    console.log(`   ➜ ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('   CodeArena — Full AI Integration Test Suite');
  console.log('═══════════════════════════════════════════════');

  // ── STEP 0: Auto-login ────────────────────────────────────────────────────
  console.log('\n🔐 Logging in...');
  try {
    const r = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const d = await r.json();
    TOKEN = d?.data?.token || d?.token || d?.data?.accessToken || d?.accessToken || '';
    if (!TOKEN) {
      console.log('   Raw response:', JSON.stringify(d, null, 2).split('\n').slice(0, 8).join('\n'));
      throw new Error('No token in response — check credentials or token field name');
    }
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };
    console.log(`   ✅ Logged in — token: ${TOKEN.slice(0, 20)}...`);
  } catch (e) {
    console.error(`\n❌ Login error: ${e.message}`);
    console.error('   Backend judge tests will be skipped.');
    TOKEN = '';
  }

  // ── TEST 1: AI service health ─────────────────────────────────────────────
  await test('AI Service Health', async () => {
    const r = await fetch(`${AI_URL}/health`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    console.log(`\n   🤖 Gemini configured: ${d.gemini_configured}`);
    console.log(`   🔑 Keys loaded: ${d.gemini_keys_loaded}`);
    console.log(`   📌 Status: ${d.gemini_status}`);
    console.log(`   🧩 Model: ${d.gemini_model}`);
    if (d.gemini_keys_loaded === 0) {
      console.log('\n   ⚠️  GEMINI NOT ACTIVE — add GEMINI_API_KEY to ai-service/.env');
    }
    return d;
  });

  // ── TEST 2: Code analysis — hash-map O(n) ─────────────────────────────────
  await test('Code Analysis — Hash Map O(n) Two Sum', async () => {
    const r = await fetch(`${AI_URL}/api/v1/analyze/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
`,
        language: 'python',
        runtime_ms: 45,
        test_cases_passed: 5,
        total_test_cases: 5,
        submission_id: 'test_hashmap_001',
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.detail || 'Analysis failed');
    const isGemini = !d.data?.explanation?.includes('Gemini not configured');
    console.log(`\n   🤖 Engine: ${isGemini ? 'REAL GEMINI AI ✨' : 'Rule-based fallback (add GEMINI_API_KEY to ai-service/.env)'}`);
    console.log(`   📊 Time: ${d.data?.time_complexity}   Space: ${d.data?.space_complexity}`);
    console.log(`   ⭐ Quality: ${d.data?.quality_label} (score: ${d.data?.quality_score})`);
    console.log(`   🔍 Algorithm: ${d.data?.algorithm_detected}`);
    if (d.data?.suggestions?.length) console.log(`   💡 Tip: ${d.data.suggestions[0]}`);
    return d.data;
  });

  // ── TEST 3: Code analysis — brute force O(n²) ─────────────────────────────
  await test('Code Analysis — Brute Force O(n²) detection', async () => {
    const r = await fetch(`${AI_URL}/api/v1/analyze/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
`,
        language: 'python',
        runtime_ms: 3200,
        test_cases_passed: 3,
        total_test_cases: 5,
        submission_id: 'test_brute_002',
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error('Analysis failed');
    console.log(`\n   📊 Time: ${d.data?.time_complexity}  (should be O(n²))`);
    console.log(`   🔁 Nesting depth: ${d.data?.metrics?.max_nesting_depth} (should be ≥ 2)`);
    console.log(`   ⭐ Quality: ${d.data?.quality_label}`);
    if (d.data?.metrics?.max_nesting_depth < 2) {
      throw new Error(`Expected nesting ≥ 2, got ${d.data?.metrics?.max_nesting_depth}`);
    }
    return d.data;
  });

  // ── TEST 4: Quick complexity (no Gemini needed) ────────────────────────────
  await test('Quick Complexity — Instant (no AI key needed)', async () => {
    const r = await fetch(`${AI_URL}/api/v1/analyze/complexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `for i in range(n):\n    for j in range(n):\n        if arr[i] + arr[j] == target:\n            print(i, j)`,
        language: 'python',
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error('Complexity check failed');
    console.log(`\n   🔁 Loop count: ${d.data.loop_count}   Max nesting: ${d.data.max_nesting_depth}`);
    console.log(`   🌀 Cyclomatic complexity: ${d.data.cyclomatic_complexity}`);
    if (d.data.loop_count < 2) throw new Error('Expected loop_count >= 2');
    return d.data;
  });

  // ── TEST 5: Plagiarism — renamed variables (should flag) ──────────────────
  await test('Plagiarism — Same algorithm, renamed vars (should be suspicious)', async () => {
    const r = await fetch(`${AI_URL}/api/v1/plagiarism/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission1: {
          id: 'sub_A', user_id: 'userA', language: 'python',
          code: `
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
`,
        },
        submission2: {
          id: 'sub_B', user_id: 'userB', language: 'python',
          code: `
def solution(arr, goal):
    lookup = {}
    for idx, val in enumerate(arr):
        if goal - val in lookup:
            return [lookup[goal - val], idx]
        lookup[val] = idx
`,
        },
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error('Plagiarism compare failed');
    const sim = d.data;
    console.log(`\n   🔎 Winnowing:  ${(sim.winnowing_similarity * 100).toFixed(1)}%`);
    console.log(`   🌳 AST:        ${(sim.ast_similarity * 100).toFixed(1)}%`);
    console.log(`   📊 Overall:    ${(sim.overall_similarity * 100).toFixed(1)}%`);
    console.log(`   ⚠️  Suspicious: ${sim.is_suspicious ? 'YES 🚨 (correct)' : 'NO — unexpected'}`);
    if (!sim.is_suspicious) throw new Error(`Expected suspicious=true, score was ${sim.overall_similarity}`);
    return sim;
  });

  // ── TEST 6: Plagiarism — different approaches (should NOT flag) ───────────
  await test('Plagiarism — Different approaches (should NOT flag)', async () => {
    const r = await fetch(`${AI_URL}/api/v1/plagiarism/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission1: {
          id: 'sub_C', user_id: 'userC', language: 'python',
          code: `
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
`,
        },
        submission2: {
          id: 'sub_D', user_id: 'userD', language: 'python',
          code: `
def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
`,
        },
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error('Plagiarism compare failed');
    const sim = d.data;
    console.log(`\n   📊 Overall: ${(sim.overall_similarity * 100).toFixed(1)}%`);
    console.log(`   ⚠️  Suspicious: ${sim.is_suspicious ? 'YES 🚨 (false positive!)' : 'NO ✅ (correct)'}`);
    if (sim.is_suspicious) throw new Error(`Expected not suspicious, score was ${sim.overall_similarity}`);
    return sim;
  });

  // ── BACKEND JUDGE TESTS (need valid token) ─────────────────────────────────
  if (!TOKEN) {
    console.log('\n⏭️  Skipping backend judge tests (login failed above)');
  } else {

    // ── TEST 7: JavaScript judge ─────────────────────────────────────────────
    await test('Backend Judge — JavaScript (stdin fix)', async () => {
      const r = await fetch(`${BACKEND_URL}/submissions/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language: 'javascript',
          code: [
            'const fs = require("fs");',
            'const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);',
            'let idx = 0;',
            'let n = input[idx++];',
            'let nums = [];',
            'for (let i = 0; i < n; i++) nums.push(input[idx++]);',
            'let target = input[idx];',
            'function twoSum(nums, target) {',
            '    let map = new Map();',
            '    for (let i = 0; i < nums.length; i++) {',
            '        let complement = target - nums[i];',
            '        if (map.has(complement)) return [map.get(complement), i];',
            '        map.set(nums[i], i);',
            '    }',
            '}',
            'let ans = twoSum(nums, target);',
            'console.log(ans[0], ans[1]);',
          ].join('\n'),
          input: '4\n2 7 11 15\n9',
        }),
      });
      const raw = await r.json();
      // raw fetch gets full body: { success, message, data: { output, verdict, runtime } }
      // (axios in frontend strips it — here we read .data manually)
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${raw?.message || JSON.stringify(raw)}`);
      const result = raw?.data || raw;
      console.log(`\n   📤 Output:  "${result.output?.trim()}"`);
      console.log(`   🏁 Verdict: ${result.verdict}`);
      console.log(`   ⏱️  Runtime: ${result.runtime}ms`);
      if (result.error) console.log(`   ❌ Error: ${result.error}`);
      if (result.output?.trim() !== '0 1') {
        throw new Error(`Got "${result.output?.trim()}", expected "0 1"`);
      }
      return result;
    });

    // ── TEST 8: Python judge ─────────────────────────────────────────────────
    await test('Backend Judge — Python (stdin read)', async () => {
      const r = await fetch(`${BACKEND_URL}/submissions/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language: 'python',
          code: [
            'import sys',
            'data = sys.stdin.read().split()',
            'idx = 0',
            'n = int(data[idx]); idx += 1',
            'nums = [int(data[idx+i]) for i in range(n)]; idx += n',
            'target = int(data[idx])',
            'seen = {}',
            'for i, v in enumerate(nums):',
            '    if target - v in seen:',
            '        print(seen[target - v], i)',
            '        break',
            '    seen[v] = i',
          ].join('\n'),
          input: '4\n2 7 11 15\n9',
        }),
      });
      const raw = await r.json();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${raw?.message || JSON.stringify(raw)}`);
      const result = raw?.data || raw;
      console.log(`\n   📤 Output:  "${result.output?.trim()}"`);
      console.log(`   🏁 Verdict: ${result.verdict}`);
      console.log(`   ⏱️  Runtime: ${result.runtime}ms`);
      if (result.output?.trim() !== '0 1') {
        throw new Error(`Got "${result.output?.trim()}", expected "0 1"`);
      }
      return result;
    });

    // ── TEST 9: C++ judge ────────────────────────────────────────────────────
    await test('Backend Judge — C++ (g++ required)', async () => {
      const r = await fetch(`${BACKEND_URL}/submissions/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language: 'cpp',
          code: [
            '#include<bits/stdc++.h>',
            'using namespace std;',
            'int main(){',
            '    int n; cin>>n;',
            '    vector<int> nums(n);',
            '    for(int i=0;i<n;i++) cin>>nums[i];',
            '    int target; cin>>target;',
            '    unordered_map<int,int> m;',
            '    for(int i=0;i<n;i++){',
            '        int c=target-nums[i];',
            '        if(m.count(c)){cout<<m[c]<<" "<<i<<endl;return 0;}',
            '        m[nums[i]]=i;',
            '    }',
            '}',
          ].join('\n'),
          input: '4\n2 7 11 15\n9',
        }),
      });
      const raw = await r.json();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${raw?.message || JSON.stringify(raw)}`);
      const result = raw?.data || raw;
      console.log(`\n   📤 Output:  "${result.output?.trim()}"`);
      console.log(`   🏁 Verdict: ${result.verdict}`);
      console.log(`   ⏱️  Runtime: ${result.runtime}ms`);
      if (result.error) console.log(`   ❌ Error: ${result.error}`);
      if (result.output?.trim() !== '0 1') {
        throw new Error(`Got "${result.output?.trim()}", expected "0 1"`);
      }
      return result;
    });
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed`);
  console.log('═══════════════════════════════════════════════');
  if (failed === 0) {
    console.log('  🎉 All systems working correctly!\n');
  } else {
    console.log('\n  Troubleshooting:');
    console.log('  • "Gemini not active"  → add GEMINI_API_KEY to ai-service/.env');
    console.log('  • Login failed         → update TEST_EMAIL/TEST_PASSWORD at top of file');
    console.log('  • JS/Python judge fail → apply submission.controller.js patch');
    console.log('  • C++ fail             → install g++: check with g++ --version\n');
  }
}

main().catch(e => {
  console.error('\n💥 Unexpected crash:', e.message);
  process.exit(1);
});