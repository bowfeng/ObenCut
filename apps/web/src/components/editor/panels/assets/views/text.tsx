

import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { useEditor } from "@/hooks/use-editor";
import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import { buildTextElement } from "@/lib/timeline/element-utils";
import { buildPromptElement } from "@/lib/timeline/element-utils";
import { MagicWand05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const DEFAULT_PROMPT_ELEMENT = {
	prompt: "Enter your AI generation prompt here",
	name: "AI Prompt",
	duration: 5,
	generationType: "image" as const,
	resolution: {
		width: 1920,
		height: 1080,
	},
};

export function TextView() {
	const editor = useEditor();

	const handleAddTextToTimeline = ({ currentTime }: { currentTime: number }) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const textElement = buildTextElement({
			raw: DEFAULT_TEXT_ELEMENT,
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			element: textElement,
			placement: { mode: "auto" },
		});
	};

	const handleAddPromptToTimeline = ({ currentTime }: { currentTime: number }) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const promptElement = buildPromptElement({
			prompt: DEFAULT_PROMPT_ELEMENT.prompt,
			name: DEFAULT_PROMPT_ELEMENT.name,
			duration: DEFAULT_PROMPT_ELEMENT.duration,
			startTime: currentTime,
			generationType: DEFAULT_PROMPT_ELEMENT.generationType,
			width: DEFAULT_PROMPT_ELEMENT.resolution.width,
			height: DEFAULT_PROMPT_ELEMENT.resolution.height,
		});

		editor.timeline.insertElement({
			element: promptElement,
			placement: { mode: "auto" },
		});
	};

	return (
		<div className="h-full flex flex-col">
			{/* Default Text */}
			<DraggableItem
				name="Default text"
				preview={
					<div className="bg-accent flex size-full items-center justify-center rounded">
						<span className="text-xs select-none">Default text</span>
					</div>
				}
				dragData={{
					id: "temp-text-id",
					type: DEFAULT_TEXT_ELEMENT.type,
					name: DEFAULT_TEXT_ELEMENT.name,
					content: DEFAULT_TEXT_ELEMENT.content,
				}}
				aspectRatio={1}
				onAddToTimeline={handleAddTextToTimeline}
				shouldShowLabel={false}
			/>

			{/* Default Prompt */}
			<DraggableItem
				name="Default prompt"
				preview={
					<div className="bg-purple-600 flex size-full items-center justify-center rounded">
						<div className="flex flex-col items-center text-center">
							<HugeiconsIcon
								icon={MagicWand05Icon}
								className="text-purple-200 mb-1"
								width="24"
								height="24"
							/>
							<span className="text-purple-100 text-[10px] font-medium select-none">
								Default
								<br />
								prompt
							</span>
						</div>
					</div>
				}
				dragData={{
					id: "temp-prompt-id",
					type: "prompt" as const,
					name: DEFAULT_PROMPT_ELEMENT.name,
					prompt: DEFAULT_PROMPT_ELEMENT.prompt,
					generationType: DEFAULT_PROMPT_ELEMENT.generationType,
				}}
				aspectRatio={1}
				onAddToTimeline={handleAddPromptToTimeline}
				shouldShowLabel={false}
			/>
		</div>
	);
}
