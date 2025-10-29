const fs = require("fs");
const path = require("path");

const ADDITIONAL_BASE_URL = "";

// فرمت‌های فایل‌هایی که می‌خواهیم پیدا کنیم
const TARGET_EXTENTIONS = [".js", ".ts", ".jsx", ".tsx", ".css"];
const OUTPUT_FILE_NAME = "merged_files.txt";

// فولدرها و فایل‌هایی که می‌خواهیم ignore شوند
const IGNORED_PATHS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "out",
  "merged_files.txt",
  "fileRestorer.js",
  "codeExtractor.js",
  "package-lock.json",
  "yarn.lock",
];

// تابع برای بررسی اینکه آیا مسیر باید ignore شود یا نه
function shouldIgnore(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath);

  // بررسی ignore list
  for (const ignoredPath of IGNORED_PATHS) {
    if (
      relativePath.includes(ignoredPath) ||
      filePath.includes(ignoredPath) ||
      path.basename(filePath) === ignoredPath
    ) {
      return true;
    }
  }

  // ignore کردن فایل‌های مخفی (که با . شروع می‌شوند)
  const pathParts = relativePath.split(path.sep);
  for (const part of pathParts) {
    if (part.startsWith(".") && part !== "." && part !== "..") {
      return true;
    }
  }

  return false;
}

// تابع برای پیدا کردن تمام فایل‌ها با فرمت‌های مشخص
function findFiles(dir, extensions, fileList = [], baseDir) {
  // اگر این دایرکتوری ignore شده باشد، از آن صرفنظر کن
  if (shouldIgnore(dir, baseDir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    // اگر این مسیر ignore شده باشد، از آن صرفنظر کن
    if (shouldIgnore(filePath, baseDir)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, extensions, fileList, baseDir);
    } else if (
      extensions.includes(path.extname(file)) &&
      !filePath.endsWith("app.js")
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// تابع برای تبدیل مسیر کامل به مسیر نسبی
function getRelativePath(fullPath, baseDir) {
  return path.relative(baseDir, fullPath);
}

// تابع برای خواندن محتوای فایل و اضافه کردن به فایل خروجی
function mergeFiles(filePaths, outputFilePath, baseDir) {
  const outputStream = fs.createWriteStream(outputFilePath);

  filePaths.forEach((filePath) => {
    const relativePath = getRelativePath(filePath, baseDir);
    const content = fs.readFileSync(filePath, "utf8");
    outputStream.write(
      `\nthe codes of file with route : ${ADDITIONAL_BASE_URL}/${relativePath} :\n`
    );
    outputStream.write(content);
    outputStream.write(
      "\n-----\n"
    );
  });

  outputStream.end();
}

// مسیر شروع جستجو و مسیر فایل خروجی
const startDir = process.cwd(); // مسیر فعلی
const outputFile = path.join(startDir, OUTPUT_FILE_NAME);

// پیدا کردن فایل‌ها (با در نظر گرفتن ignore)
const files = findFiles(startDir, TARGET_EXTENTIONS, [], startDir);

// ادغام فایل‌ها و ایجاد فایل خروجی
mergeFiles(files, outputFile, startDir);

console.log(`SAVED IN ${outputFile} `);
console.log(`Total files processed: ${files.length}`);

