/**
 * push_to_github.mjs
 * رفع جميع ملفات المشروع إلى GitHub عبر REST API
 * Developer: بلقاسم محروق الراس
 * Usage: node push_to_github.mjs
 */

import { readFileSync, statSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join, relative } from "path";

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "skacimo1985-star";
const REPO = "legal-algeria-hub";
const BRANCH = "main";
const ROOT = process.cwd();

const EXCLUDE = new Set([
  ".git", "node_modules", ".cache", ".local",
  "attached_assets", "__pycache__", ".expo",
  "dist", ".pnpm-store", "tmp", "out-tsc",
]);

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB per file

// ── GitHub API helper ──────────────────────────────────────────────────────
async function api(method, endpoint, body) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mizan-sirep-pusher/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API ${method} ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

// ── Walk directory recursively ─────────────────────────────────────────────
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      const { size } = statSync(fullPath);
      if (size > MAX_FILE_BYTES) {
        console.log(`  ⚠️  Skip (>8MB): ${relative(ROOT, fullPath)}`);
        continue;
      }
      files.push(fullPath);
    }
  }
  return files;
}

// ── Create a single blob ───────────────────────────────────────────────────
async function createBlob(filePath) {
  const content = readFileSync(filePath);
  const result = await api("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
    content: content.toString("base64"),
    encoding: "base64",
  });
  return result.sha;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ميزان SIREP → GitHub Pusher");
  console.log(`  Target: github.com/${OWNER}/${REPO}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 1. Check token
  if (!TOKEN) {
    console.error("❌ GITHUB_TOKEN غير موجود في البيئة!");
    console.error("   أضفه في: Tools → Secrets → GITHUB_TOKEN=ghp_...");
    process.exit(1);
  }
  console.log("✅ GITHUB_TOKEN موجود\n");

  // 2. Verify token & repo access
  console.log("🔍 التحقق من الوصول للمستودع...");
  let repoInfo;
  try {
    repoInfo = await api("GET", `/repos/${OWNER}/${REPO}`);
    console.log(`✅ المستودع موجود: ${repoInfo.full_name} (${repoInfo.private ? "خاص" : "عام"})\n`);
  } catch (e) {
    console.error(`❌ خطأ في الوصول للمستودع: ${e.message}`);
    console.error("   تأكد أن المستودع موجود وأن التوكن لديه صلاحية repo");
    process.exit(1);
  }

  // 3. Get all files
  console.log("📂 جمع ملفات المشروع...");
  const allFiles = await walk(ROOT);
  console.log(`✅ تم العثور على ${allFiles.length} ملف للرفع\n`);

  // 4. Get base commit/tree
  let baseCommitSha = null;
  let baseTreeSha = null;
  try {
    const ref = await api("GET", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
    baseCommitSha = ref.object.sha;
    const commit = await api("GET", `/repos/${OWNER}/${REPO}/git/commits/${baseCommitSha}`);
    baseTreeSha = commit.tree.sha;
    console.log(`📌 Base commit: ${baseCommitSha.slice(0, 8)}\n`);
  } catch {
    console.log("📌 فرع main جديد — سيتم إنشاؤه\n");
  }

  // 5. Create blobs (in batches to avoid rate limits)
  console.log("⬆️  رفع الملفات إلى GitHub...");
  const treeItems = [];
  const BATCH = 5;

  for (let i = 0; i < allFiles.length; i += BATCH) {
    const batch = allFiles.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (fp) => {
        const relPath = relative(ROOT, fp).replace(/\\/g, "/");
        try {
          const sha = await createBlob(fp);
          treeItems.push({ path: relPath, mode: "100644", type: "blob", sha });
        } catch (e) {
          console.log(`  ⚠️  Skip ${relPath}: ${e.message.slice(0, 60)}`);
        }
      })
    );
    const done = Math.min(i + BATCH, allFiles.length);
    process.stdout.write(`  📤 ${done}/${allFiles.length} ملف...\r`);
  }
  console.log(`\n✅ تم رفع ${treeItems.length} ملف كـ blobs\n`);

  // 6. Create tree
  console.log("🌳 إنشاء شجرة الملفات...");
  const treeData = { tree: treeItems };
  if (baseTreeSha) treeData.base_tree = baseTreeSha;
  const newTree = await api("POST", `/repos/${OWNER}/${REPO}/git/trees`, treeData);
  console.log(`✅ Tree: ${newTree.sha.slice(0, 8)}\n`);

  // 7. Create commit
  console.log("📝 إنشاء commit...");
  const commitData = {
    message: `feat: ميزان SIREP — بوابة قانونية جزائرية شاملة\n\n- 49+ قانون جزائري قابل للبحث\n- SEO برمجي: قاموس + تخصصات + صفحات مهنية\n- ترخيص مؤسسي: محامون، موثقون، خبراء، مستشارون\n- تجربة مجانية 14 يوم\n- واتساب +213 556 64 02 11\n- Developer: بلقاسم محروق الراس`,
    tree: newTree.sha,
    author: {
      name: "بلقاسم محروق الراس",
      email: "belkacem.mahrougas@dzlaw.dz",
      date: new Date().toISOString(),
    },
  };
  if (baseCommitSha) commitData.parents = [baseCommitSha];

  const newCommit = await api("POST", `/repos/${OWNER}/${REPO}/git/commits`, commitData);
  console.log(`✅ Commit: ${newCommit.sha.slice(0, 8)}\n`);

  // 8. Update/create branch ref
  console.log(`🔀 تحديث فرع ${BRANCH}...`);
  try {
    await api("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: newCommit.sha,
      force: true,
    });
  } catch {
    await api("POST", `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: `refs/heads/${BRANCH}`,
      sha: newCommit.sha,
    });
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ تم الرفع بنجاح!");
  console.log(`🔗 https://github.com/${OWNER}/${REPO}`);
  console.log(`📦 Commit: ${newCommit.sha.slice(0, 8)}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error("\n❌ فشل الرفع:", err.message);
  process.exit(1);
});
