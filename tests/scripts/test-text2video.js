const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function testText2Video() {
  const screenshotsDir = path.join(__dirname, "test-screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log("✅ 打开 OpenCut 应用...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 30000 });
    
    // Screenshot 1: Homepage
    await page.screenshot({ path: path.join(screenshotsDir, "01-homepage.png") });
    console.log("📸 截图：首页");
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check for text2video related elements
    const aigcElements = await page.$x('//button[contains(text(), "AIGC") or contains(text(), "AI") or contains(text(), "生成")]');
    console.log(`🔍 找到 ${aigcElements.length} 个 AI 相关元素`);
    
    // Screenshot 2: After waiting
    await page.screenshot({ path: path.join(screenshotsDir, "02-waited.png") });
    console.log("📸 截图：等待后");
    
    // Try to find and click on any AIGC button
    const buttons = await page.$$('button');
    for (let i = 0; i < buttons.length; i++) {
      const text = await page.evaluate(el => el.textContent, buttons[i]);
      if (text && (text.includes("AIGC") || text.includes("生成视频") || text.includes("Video"))) {
        console.log(`✅ 找到视频生成按钮："${text}"`);
        await buttons[i].click();
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(screenshotsDir, "03-clicked-aigc.png") });
        console.log("📸 截图：点击 AIGC 后");
        break;
      }
    }
    
    // Look for prompt input
    const inputs = await page.$$('input, textarea');
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await page.evaluate(el => el.placeholder, inputs[i]);
      if (placeholder && (placeholder.includes("prompt") || placeholder.includes("描述") || placeholder.includes("text"))) {
        console.log(`✅ 找到提示词输入框`);
        await inputs[i].type("A cat jumping on the table");
        await page.screenshot({ path: path.join(screenshotsDir, "04-input-prompt.png") });
        console.log("📸 截图：输入 prompt 后");
        
        // Look for generate button
        const generateBtns = await page.$$('button');
        for (let btn of generateBtns) {
          const btnText = await page.evaluate(el => el.textContent, btn);
          if (btnText && (btnText.includes("生成") || btnText.includes("Generate") || btnText.includes("Create"))) {
            console.log(`✅ 点击生成按钮："${btnText}"`);
            await btn.click();
            await new Promise(r => setTimeout(r, 5000));
            await page.screenshot({ path: path.join(screenshotsDir, "05-after-generate.png") });
            console.log("📸 截图：生成后");
            break;
          }
        }
        break;
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, "06-final.png") });
    console.log("📸 截图：最终状态");
    
  } catch (error) {
    console.error("❌ 测试出错:", error.message);
    await page.screenshot({ path: path.join(screenshotsDir, "error.png") });
  } finally {
    await browser.close();
  }
  
  console.log("\n✅ 测试完成！截图保存在 test-screenshots/");
}

testText2Video();
