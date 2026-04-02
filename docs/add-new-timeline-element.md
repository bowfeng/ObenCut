# 添加新的 Timeline Element 指南

本文档详细说明了如何在 OpenCut 中添加新的 Timeline Element 类型。

## 添加新 Timeline Element 需要的修改

根据 `PromptElement` 的实现示例和 `EffectElement` 的代码，添加新的 timeline element 需要以下修改：

### 1. 类型定义 (apps/web/src/types/timeline.ts)

#### 步骤：
1. 在 `TrackType` 中添加新的 track 类型字符串（如 `"effect"`, `"prompt"`）

```typescript
export type TrackType = "video" | "text" | "audio" | "sticker" | "effect" | "prompt" | "xxx";
```

2. 创建对应的 Track 接口（继承 `BaseTrack`）

```typescript
export interface XxxTrack extends BaseTrack {
  type: "xxx";  // 新的 track 类型
  elements: XxxElement[];  // 对应的元素数组
  // 特有的属性（根据需要添加）
}
```

3. 更新 `TimelineTrack` 联合类型

```typescript
export type TimelineTrack =
  | VideoTrack
  | TextTrack
  | PromptTrack
  | AudioTrack
  | StickerTrack
  | EffectTrack
  | XxxTrack;  // 添加新的 track 类型
```

4. 创建对应的 Element 接口（继承 `BaseTimelineElement`）

```typescript
export interface XxxElement extends BaseTimelineElement {
  type: "xxx";  // 新的 element 类型
  // 特有属性
  // 例如：
  // property: string;
  // numberValue: number;
}
```

5. 更新 `VisualElement` 联合类型（如果是视觉元素）

```typescript
export type VisualElement =
  | VideoElement
  | ImageElement
  | TextElement
  | StickerElement
  | XxxElement;  // 如果是视觉元素则添加
```

6. 更新 `TimelineElement` 联合类型

```typescript
export type TimelineElement =
  | AudioElement
  | VideoElement
  | ImageElement
  | TextElement
  | StickerElement
  | EffectElement
  | PromptElement
  | XxxElement;  // 添加新的 element 类型
```

7. 更新 `ElementType` 类型

```typescript
export type ElementType = TimelineElement["type"];
```

8. 创建 `CreateXxxElement` 类型

```typescript
export type CreateXxxElement = Omit<XxxElement, "id">;
```

9. 更新 `CreateTimelineElement` 联合类型

```typescript
export type CreateTimelineElement =
  | CreateAudioElement
  | CreateVideoElement
  | CreateImageElement
  | CreateTextElement
  | CreateStickerElement
  | CreateEffectElement
  | CreatePromptElement
  | CreateXxxElement;  // 添加新的 create 类型
```

---

### 2. 构建函数 (apps/web/src/lib/timeline/element-utils.ts)

#### 步骤：

1. 导入新的 Element 类型

```typescript
import type {
  // ... 其他导入
  CreateXxxElement,
  XxxElement,
} from "@/types/timeline";
```

2. 创建 `buildXxxElement` 函数

```typescript
export function buildXxxElement({
  // 参数定义
  property,  // 特有属性
  startTime,
  duration = TIMELINE_CONSTANTS.DEFAULT_ELEMENT_DURATION,
  // 其他必要参数
}: {
  property: string;
  startTime: number;
  duration?: number;
  // ... 其他参数
}): CreateXxxElement {
  return {
    type: "xxx",
    name: "Xxx Element",  // 默认名称
    startTime,
    duration,
    trimStart: 0,
    trimEnd: 0,
    // 设置特有属性
    property,
    // 设置其他默认属性
    // transform: { ...DEFAULT_TRANSFORM },
    // opacity: DEFAULT_OPACITY,
    // blendMode: DEFAULT_BLEND_MODE,
  };
}
```

---

### 3. 拖拽数据类型 (apps/web/src/types/drag.ts)

#### 步骤：

1. 创建对应的 DragData 接口

```typescript
export interface XxxDragData extends BaseDragData {
  type: "xxx";  // 必须是 "effect", "prompt", "sticker" 等
  // 特有属性
  // 例如：
  // xxxType: string;
}
```

2. 更新 `TimelineDragData` 联合类型

```typescript
export type TimelineDragData =
  | MediaDragData
  | TextDragData
  | PromptDragData
  | StickerDragData
  | EffectDragData
  | XxxDragData;  // 添加新的 drag 数据类型
```

---

### 4. 拖放处理 (apps/web/src/hooks/timeline/use-timeline-drag-drop.ts)

#### 步骤：

1. 导入新的函数和类型

```typescript
import {
  buildTextElement,
  buildStickerElement,
  buildElementFromMedia,
  buildEffectElement,
  buildPromptElement,
  buildXxxElement,  // 添加新的构建函数
} from "@/lib/timeline/element-utils";

import type {
  MediaDragData,
  StickerDragData,
  EffectDragData,
  PromptDragData,
  XxxDragData,  // 添加新的 drag 数据类型
} from "@/types/drag";
```

2. 在 `getElementType` 函数中添加类型判断

```typescript
const getElementType = useCallback(
  ({ dataTransfer }: { dataTransfer: DataTransfer }): ElementType | null => {
    const dragData = getDragData({ dataTransfer });
    if (!dragData) return null;

    if (dragData.type === "text") return "text";
    if (dragData.type === "sticker") return "sticker";
    if (dragData.type === "effect") return "effect";
    if (dragData.type === "prompt") return "prompt";
    if (dragData.type === "xxx") return "xxx";  // 添加新的类型判断
    if (dragData.type === "media") {
      return dragData.mediaType;
    }
    return null;
  },
  [],
);
```

3. 在 `getElementDuration` 函数中添加元素类型判断

```typescript
const getElementDuration = useCallback(
  ({
    elementType,
    mediaId,
  }: {
    elementType: ElementType;
    mediaId?: string;
  }): number => {
    if (
      elementType === "text" ||
      elementType === "sticker" ||
      elementType === "effect" ||
      elementType === "prompt" ||
      elementType === "xxx"  // 添加新的元素类型
    ) {
      return TIMELINE_CONSTANTS.DEFAULT_ELEMENT_DURATION;
    }
    if (mediaId) {
      const media = mediaAssets.find((m) => m.id === mediaId);
      return media?.duration ?? TIMELINE_CONSTANTS.DEFAULT_ELEMENT_DURATION;
    }
    return TIMELINE_CONSTANTS.DEFAULT_ELEMENT_DURATION;
  },
  [mediaAssets],
);
```

4. 在 `handleDragOver` 中更新 `targetElementTypes` 的逻辑

```typescript
const targetElementTypes =
  dragData?.type === "effect"
    ? (dragData as EffectDragData).targetElementTypes
    : dragData?.type === "media"
      ? (dragData as MediaDragData).targetElementTypes
      : dragData?.type === "prompt"
        ? ["video"]
        : dragData?.type === "xxx"  // 添加新的类型
          ? (dragData as XxxDragData).targetElementTypes
          : undefined;
```

5. 创建 `executeXxxDrop` 函数处理拖放逻辑

```typescript
const executeXxxDrop = useCallback(
  ({ target, dragData }: {
    target: DropTarget;
    dragData: XxxDragData;
  }) => {
    const element = buildXxxElement({
      property: dragData.property,  // 使用 dragData 的属性
      name: dragData.name,
      duration: TIMELINE_CONSTANTS.DEFAULT_ELEMENT_DURATION,
      startTime: target.xPosition,
      // 其他必要参数
    });

    if (target.isNewTrack) {
      // 创建新 track
      const addTrackCmd = new AddTrackCommand("video", target.trackIndex);
      const insertCmd = new InsertElementCommand({
        element,
        placement: { mode: "explicit", trackId: addTrackCmd.getTrackId() },
      });
      editor.command.execute({
        command: new BatchCommand([addTrackCmd, insertCmd]),
      });
      return;
    }

    // 在现有 track 中插入元素
    const track = tracks[target.trackIndex];
    if (!track) return;
    editor.timeline.insertElement({
      placement: { mode: "explicit", trackId: track.id },
      element,
    });
  },
  [editor.command, editor.timeline, tracks],
);
```

6. 在 `handleDrop` 函数的 switch/if 语句中添加处理

```typescript
if (dragData.type === "text") {
  executeTextDrop({ target: currentTarget, dragData });
} else if (dragData.type === "sticker") {
  executeStickerDrop({ target: currentTarget, dragData });
} else if (dragData.type === "effect") {
  executeEffectDrop({
    target: currentTarget,
    dragData: dragData as EffectDragData,
  });
} else if (dragData.type === "prompt") {
  executePromptDrop({ target: currentTarget, dragData });
} else if (dragData.type === "xxx") {  // 添加新的类型处理
  executeXxxDrop({ target: currentTarget, dragData });
} else {
  executeMediaDrop({ target: currentTarget, dragData });
}
```

---

### 5. 其他可能需要的修改

#### 命令系统
如果需要专门的命令，在 `@/lib/commands/` 中创建对应的 Command 类

#### 渲染器
在渲染代码中处理新元素的渲染逻辑

#### UI 组件
如果需要专门的编辑面板或属性面板，创建相应的 React 组件

#### 存储/序列化
确保 Element 的序列化和反序列化支持新类型

---

## 示例：PromptElement 的实现流程

### 1. 类型定义
- 添加 `"prompt"` 到 `TrackType`
- 创建 `PromptTrack` 接口
- 更新 `TimelineTrack`
- 创建 `PromptElement` 接口
- 更新 `VisualElement`、`TimelineElement`、`ElementType`
- 创建 `CreatePromptElement` 和更新 `CreateTimelineElement`

### 2. 构建函数
- 导入相关类型
- 创建 `buildPromptElement` 函数

### 3. 拖拽数据类型
- 创建 `PromptDragData` 接口
- 更新 `TimelineDragData`

### 4. 拖放处理
- 导入 `buildPromptElement` 和 `PromptDragData`
- 在 `getElementType` 中添加类型判断
- 在 `getElementDuration` 中添加类型判断
- 创建 `executePromptDrop` 函数
- 在 `handleDrop` 中添加处理

---

## 关键注意事项

1. **类型一致性**：所有相关的类型定义必须保持一致，尤其是 `type` 字段
2. **默认值**：确保所有必需的属性都有合理的默认值
3. **Drag 数据**：拖拽数据类型必须包含 `type` 字段用于区分不同的元素类型
4. **Track 选择**：拖放时需要确定使用哪个 track（新创建还是现有）
5. **向后兼容**：确保新类型不会破坏现有的功能