# AI Generation - 错误处理修复

## 问题：连接失败但状态显示成功

### 问题描述

当 ComfyUI 服务器连接失败时，UI 显示成功，并添加了 imageElement 到 timeline，但实际上生成失败。

### 根本原因

在 `ai-provider-factory.ts` 的 `initializeAll()` 方法中，错误被静默捕获：

```typescript
// ❌ 旧代码 - 错误被静默捕获
async initializeAll(): Promise<void> {
  for (const provider of this.getAllProviders()) {
    try {
      await provider.initialize();
    } catch (error) {
      console.error(`Failed to initialize ${provider.id}:`, error);
      // 不抛出错误，导致后续操作继续
    }
  }
}
```

**问题流程：**
1. `initializeAll()` 成功返回（忽略错误）
2. `generate()` 被调用
3. `provider.generate()` 抛出连接错误
4. 错误被 catch 块捕获
5. `updateTaskStatus(taskId, "completed", ...)` 被调用
6. UI 显示成功状态
7. `resultElement` 被添加到 task
8. 自动添加到 timeline

### 修复方案

修改 `initializeAll()` 方法，捕获所有错误并抛出：

```typescript
// ✅ 新代码 - 抛出错误
async initializeAll(): Promise<void> {
  const errors: Error[] = [];

  for (const provider of this.getAllProviders()) {
    try {
      await provider.initialize();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to initialize ${provider.id}:`, error);
      errors.push(new Error(`Failed to initialize ${provider.id}: ${errorMessage}`));
    }
  }

  // 如果有任何初始化错误，抛出第一个错误
  if (errors.length > 0) {
    throw errors[0];
  }
}
```

**修复后的流程：**
1. `initializeAll()` 抛出连接错误
2. `handleCreate()` catch 错误
3. `updateTaskStatus(taskId, "failed", ...)` 被调用
4. UI 显示失败状态
5. 不添加 imageElement 到 timeline

### 同样修复 `disconnectAll()` 方法

```typescript
// ✅ 新代码 - 抛出错误
async disconnectAll(): Promise<void> {
  const errors: Error[] = [];

  for (const provider of this.providers.values()) {
    try {
      await provider.disconnect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error disconnecting ${provider.id}:`, error);
      errors.push(new Error(`Error disconnecting ${provider.id}: ${errorMessage}`));
    }
  }

  if (errors.length > 0) {
    throw errors[0];
  }
}
```

## 测试场景

### 场景 1：ComfyUI 连接成功
**预期：** 生成成功，添加 imageElement
**结果：** ✅ 通过

### 场景 2：ComfyUI 连接失败
**预期：** 显示错误，不添加 imageElement
**结果：** ✅ 通过（修复后）

### 场景 3：ComfyUI 未运行
**预期：** 显示连接错误
**结果：** ✅ 通过（修复后）

## 错误传播流程

```
用户点击按钮
    ↓
handleCreate() 调用
    ↓
aiProviderFactory.initializeAll()
    ↓
ComfyUIProvider.initialize()
    ↓
ComfyUIWrapper.connect()
    ↓
❌ 连接失败
    ↓
抛出错误
    ↓
handleCreate() catch
    ↓
updateTaskStatus(taskId, "failed")
    ↓
UI 显示失败状态
    ↓
不添加 imageElement
```

## 最佳实践

1. **不要静默捕获初始化错误**
   - `initializeAll()` 应该在初始化失败时抛出错误
   - 允许调用方处理错误

2. **错误处理层次**
   - Factory 层：捕获所有错误，抛出第一个
   - Provider 层：验证状态，抛出明确错误
   - UI 层：处理错误，更新状态，显示用户友好消息

3. **状态一致性**
   - 只在成功时更新为 "completed"
   - 只在成功时添加 resultElement
   - 错误时更新为 "failed"，保留 errorMessage

## 相关文件

- `apps/web/src/lib/api/ai-provider-factory.ts` - Factory 层错误处理
- `apps/web/src/lib/api/providers/comfyui-provider.ts` - Provider 层错误处理
- `apps/web/src/lib/api/comfyui-api.ts` - Wrapper 层错误处理
- `apps/web/src/components/editor/panels/properties/sections/prompt-ai-generation.tsx` - UI 层错误处理

## 完整错误处理流程

```
用户输入 prompt
    ↓
点击"Generate"按钮
    ↓
handleCreate() 执行
    ↓
检查现有任务
    ↓
创建 taskId = comfyui-${timestamp}
    ↓
调用 aiProviderFactory.initializeAll()
    ↓
ComfyUIProvider.initialize()
    ↓
ComfyUIWrapper.connect()
    ↓
❌ WebSocket 连接超时
    ↓
抛出错误: "Failed to connect to ComfyUI at http://localhost:8188"
    ↓
aiProviderFactory.initializeAll() 捕获并抛出错误
    ↓
handleCreate() catch 块
    ↓
updateTaskStatus(taskId, "failed", 0, errorMessage)
    ↓
UI 显示失败状态（红色 Alert 图标）
    ↓
✅ 不添加 imageElement
```

## 修复的关键问题

### 1. `initializeAll()` 不再静默捕获错误
**修复前：**
```typescript
try {
  await provider.initialize();
} catch (error) {
  console.error(...);
  // ❌ 不抛出，继续执行
}
```

**修复后：**
```typescript
try {
  await provider.initialize();
} catch (error) {
  console.error(...);
  errors.push(error);
}
if (errors.length > 0) {
  throw errors[0]; // ✅ 抛出第一个错误
}
```

### 2. `taskId` 在 try 块之前定义
**修复前：**
```typescript
const taskId = `comfyui-${Date.now()}`; // 在 try 块内
try {
  // ...
} catch (error) {
  updateTaskStatus(taskId, ...); // ❌ taskId 未定义
}
```

**修复后：**
```typescript
const taskId = `comfyui-${Date.now()}`; // ✅ 在 try 块之前
try {
  // ...
} catch (error) {
  updateTaskStatus(taskId, ...); // ✅ 可以访问
}
```
