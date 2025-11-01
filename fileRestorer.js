const fs = require("fs");
const path = require("path");

const INPUT_FILE_NAME = "merged_files.txt";
const BASE_DIR = process.cwd();

// تابع برای تجزیه فایل ادغام شده و استخراج فایل‌ها
function parseMergedFile(inputFilePath) {
    const content = fs.readFileSync(inputFilePath, "utf8");
    const files = [];
    
    // الگوی regex برای شناسایی بخش‌های فایل
    const fileSectionRegex = /the codes of file with route : (.*?) :\n(.*?)\n-----/gs;
    
    let match;
    while ((match = fileSectionRegex.exec(content)) !== null) {
        const filePath = match[1].trim();
        const fileContent = match[2].trim();
        
        files.push({
            path: filePath,
            content: fileContent
        });
    }
    
    return files;
}

// تابع برای ایجاد دایرکتوری‌های لازم
function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
}

// تابع برای ذخیره فایل‌ها
function saveFiles(files, baseDir) {
    let createdCount = 0;
    let updatedCount = 0;
    
    files.forEach(file => {
        // حذف ADDITIONAL_BASE_URL از مسیر اگر وجود دارد
        let relativePath = file.path;
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }
        
        const fullPath = path.join(baseDir, relativePath);
        
        try {
            ensureDirectoryExists(fullPath);
            
            // بررسی اینکه آیا فایل از قبل وجود دارد
            const exists = fs.existsSync(fullPath);
            
            fs.writeFileSync(fullPath, file.content, 'utf8');
            
            if (exists) {
                console.log(`🔄 Updated: ${relativePath}`);
                updatedCount++;
            } else {
                console.log(`✅ Created: ${relativePath}`);
                createdCount++;
            }
        } catch (error) {
            console.error(`❌ Error saving ${relativePath}:`, error.message);
        }
    });
    
    return { createdCount, updatedCount };
}

// تابع اصلی
function restoreFilesFromMerged() {
    const inputFile = path.join(BASE_DIR, INPUT_FILE_NAME);
    
    // بررسی وجود فایل ورودی
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ File not found: ${INPUT_FILE_NAME}`);
        console.log(`Please make sure ${INPUT_FILE_NAME} exists in the current directory.`);
        return;
    }
    
    console.log(`📖 Reading merged file: ${INPUT_FILE_NAME}`);
    
    try {
        // تجزیه فایل ادغام شده
        const files = parseMergedFile(inputFile);
        
        if (files.length === 0) {
            console.log("❌ No files found in the merged file.");
            return;
        }
        
        console.log(`📋 Found ${files.length} files to restore`);
        
        // نمایش لیست فایل‌ها
        console.log("\n📄 Files to restore:");
        files.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.path}`);
        });
        
        // درخواست تأیید از کاربر
        console.log(`\n⚠️  This will create/overwrite ${files.length} files in: ${BASE_DIR}`);
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question('Do you want to continue? (y/N): ', (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                console.log("\n🚀 Starting file restoration...\n");
                
                // ذخیره فایل‌ها
                const { createdCount, updatedCount } = saveFiles(files, BASE_DIR);
                
                console.log(`\n🎉 Restoration completed!`);
                console.log(`✅ Created: ${createdCount} files`);
                console.log(`🔄 Updated: ${updatedCount} files`);
                console.log(`📊 Total: ${createdCount + updatedCount} files processed`);
            } else {
                console.log("❌ Operation cancelled.");
            }
            
            readline.close();
        });
        
    } catch (error) {
        console.error("❌ Error processing merged file:", error.message);
    }
}

// نسخه بدون تأیید (برای استفاده در اسکریپت‌ها)
function restoreFilesFromMergedSilent() {
    const inputFile = path.join(BASE_DIR, INPUT_FILE_NAME);
    
    if (!fs.existsSync(inputFile)) {
        throw new Error(`File not found: ${INPUT_FILE_NAME}`);
    }
    
    const files = parseMergedFile(inputFile);
    
    if (files.length === 0) {
        throw new Error("No files found in the merged file");
    }
    
    const { createdCount, updatedCount } = saveFiles(files, BASE_DIR);
    
    return {
        totalFiles: files.length,
        created: createdCount,
        updated: updatedCount
    };
}

// اجرای اسکریپت
if (require.main === module) {
    restoreFilesFromMerged();
}

module.exports = {
    parseMergedFile,
    restoreFilesFromMerged,
    restoreFilesFromMergedSilent
};
