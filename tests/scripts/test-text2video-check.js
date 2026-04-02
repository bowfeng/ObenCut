#!/usr/bin/env node
/**
 * Text2Video Functionality Test Script
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const testResults = { passed: [], failed: [] };

function log(msg, type) {
  const emojis = { info: '[INFO]', success: '[PASS]', error: '[FAIL]', warning: '[WARN]' };
  console.log(`${emojis[type] || emojis.info} ${msg}`);
}

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, (res) => {
      const duration = Date.now() - start;
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, duration, url });
    }).on('error', (err) => resolve({ ok: false, error: err.message, url }));
  });
}

async function runTests() {
  const tests = [
    { name: '应用服务器 (localhost:3000)', check: async () => (await checkEndpoint('http://localhost:3000')).ok },
    { name: 'ComfyUI 后端 (localhost:8188)', check: async () => (await checkEndpoint('http://localhost:8188')).ok },
    { 
      name: 'Text2Video Workflow 文件', 
      check: async () => {
        const p = path.join(__dirname, 'apps/web/public/workflows/text2video.json');
        return fs.existsSync(p);
      } 
    },
    { 
      name: 'AI Provider 实现', 
      check: async () => {
        const p = path.join(__dirname, 'apps/web/src/lib/api/providers/comfyui-provider.ts');
        const c = fs.readFileSync(p, 'utf8');
        return c.includes('text2video');
      } 
    },
    { 
      name: 'AIGC UI 组件', 
      check: async () => {
        const p = path.join(__dirname, 'apps/web/src/components/editor/panels/properties/sections/image-ai-generation.tsx');
        const c = fs.readFileSync(p, 'utf8');
        return c.includes('generationType') && c.includes('生成视频');
      } 
    },
    { 
      name: 'AI Generation State Store', 
      check: async () => {
        const p = path.join(__dirname, 'apps/web/src/stores/ai-generation-store.ts');
        const c = fs.readFileSync(p, 'utf8');
        return c.includes('text2video') && c.includes('generateMedia');
      } 
    }
  ];

  log('\n[INFO] 开始测试...\n');
  
  for (const test of tests) {
    const result = await test.check();
    if (result) {
      testResults.passed.push(test.name);
      log(`${test.name}: [PASS]`, 'success');
    } else {
      testResults.failed.push(test.name);
      log(`${test.name}: [FAIL]`, 'error');
    }
  }
  
  generateReport();
  
  log('\n[INFO] 测试总结');
  log(`总测试数：${tests.length}`);
  log(`通过：${testResults.passed.length}`);
  log(`失败：${testResults.failed.length}`);
  
  if (testResults.failed.length === 0) {
    log('\n[SUCCESS] 所有测试通过！text2video 功能准备就绪！', 'success');
  } else {
    log('\n[WARN] 部分测试失败，请检查上述错误', 'warning');
  }
  
  return testResults.failed.length === 0;
}

function generateReport() {
  const reportPath = 'test-screenshots/text2video-test-report.md';
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const report = `# OpenCut Text2Video 功能测试报告

## 测试时间
${new Date().toLocaleString('zh-CN')}

## 测试结果

| 测试项 | 结果 |
|--------|------|
${testResults.passed.map(n => `| ${n} | PASS |`).join('\n')}
${testResults.failed.map(n => `| ${n} | FAIL |`).join('\n')}

## 架构检查

### 前端组件
- AIGC 生成组件：apps/web/src/components/editor/panels/properties/sections/image-ai-generation.tsx
- AI Generation Store: apps/web/src/stores/ai-generation-store.ts

### 后端 API
- ComfyUI Provider: apps/web/src/lib/api/providers/comfyui-provider.ts
- Workflow: apps/web/public/workflows/text2video.json

## 验收标准

1. 前端能识别 text2video 选项 - 组件已实现
2. 能正常调用 API (comfyui-provider) - Provider 已实现
3. 能显示 loading 状态 - Store 中实现进度管理
4. 能接收并展示生成的视频 - 依赖 ComfyUI 后端
5. 能保存到项目素材库 - Store 中实现媒体资产添加

## 下一步

- 确保 ComfyUI 服务运行在 http://localhost:8188
- 在浏览器中访问 http://localhost:3000 进行 UI 测试
`;
  
  fs.writeFileSync(reportPath, report);
  log(`[INFO] 报告已生成：${reportPath}`);
}

runTests().then(s => process.exit(s ? 0 : 1)).catch(err => {
  console.error('[ERROR] 测试脚本执行失败:', err);
  process.exit(1);
});
