import { test, expect } from "@playwright/test";

test("text2video UI Test", async ({ page }) => {
  // Navigate to the application
  await page.goto("http://localhost:3000");
  console.log("✅ 已打开 OpenCut 应用");
  
  // Screenshot: Home page
  await page.screenshot({ path: "/home/bow/.openclaw/workspace/opencut/test-screenshots/01-homepage.png" });
  console.log("📸 截图：首页");
  
  // Wait for app to load
  await page.waitForTimeout(3000);
  
  // Look for any AI generation related elements
  const aiElements = await page.locator('text=AIGC, text=AI Generation, text=AI, text=生成').all();
  console.log(`🔍 找到 ${aiElements.length} 个 AI 相关元素`);
  
  // Try to find editor or timeline
  const editor = await page.locator('text=Editor, text=时间轴, text=Timeline').first();
  if (editor) {
    console.log("✅ 找到编辑器/时间轴入口");
    await editor.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/home/bow/.openclaw/workspace/opencut/test-screenshots/02-editor.png" });
    console.log("📸 截图：编辑器");
  }
  
  // Look for properties panel with AIGC section
  const aigcSection = await page.locator('text=AIGC 生成').first();
  if (aigcSection) {
    console.log("✅ 找到 AIGC 生成面板");
    await page.screenshot({ path: "/home/bow/.openclaw/workspace/opencut/test-screenshots/03-aigc-panel.png" });
    console.log("📸 截图：AIGC 面板");
    
    // Look for text2video specifically
    const videoGenBtn = await page.locator('text=生成视频, text=Video, text=Video Generation').first();
    if (videoGenBtn) {
      console.log("✅ 找到视频生成按钮");
      await videoGenBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "/home/bow/.openclaw/workspace/opencut/test-screenshots/04-video-gen.png" });
      console.log("📸 截图：视频生成界面");
    }
  } else {
    console.log("❌ 未找到 AIGC 生成面板");
  }
  
  // Screenshot final state
  await page.screenshot({ path: "/home/bow/.openclaw/workspace/opencut/test-screenshots/05-final.png" });
  console.log("📸 截图：最终状态");
});
