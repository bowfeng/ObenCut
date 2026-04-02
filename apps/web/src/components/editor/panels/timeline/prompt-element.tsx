"use client";

import { PromptElement } from "@/types/prompt-element";
import { getTrackHeight } from "@/lib/timeline";
import { AiContentGenerator02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PromptTimelineElementProps {
	element: PromptElement;
	isSelected: boolean;
}

export function PromptTimelineElement({
	element,
	isSelected,
}: PromptTimelineElementProps) {
	const trackHeight = getTrackHeight({ type: "video" });
	
	// 截取提示词预览，避免太长
	const previewText = element.prompt?.slice(0, 30) || "No prompt";
	const hasOverflow = (element.prompt?.length ?? 0) > 30;

	return (
		<div
			className="relative h-full overflow-hidden rounded-sm bg-purple-600 flex items-center px-2"
			style={{
				minHeight: `${trackHeight}px`,
				opacity: element.hidden ? 0.5 : 1,
			}}
		>
			<div className="flex items-center gap-1.5 min-w-0 flex-1">
				<div className="shrink-0 text-purple-200">
					<HugeiconsIcon
						icon={AiContentGenerator02Icon}
						width="14"
						height="14"
					/>
				</div>
				<span className="text-white text-xs truncate font-medium">
					{previewText}
					{hasOverflow && "..."}
				</span>
			</div>
			
			{/* 生成类型指示器 */}
			<div className="absolute right-1 top-1">
				{element.generationType === "video" ? (
					<div className="bg-purple-800/80 rounded px-1 py-0.5 text-[9px] text-purple-100">
						V
					</div>
				) : (
					<div className="bg-purple-800/80 rounded px-1 py-0.5 text-[9px] text-purple-100">
						I
					</div>
				)}
			</div>
		</div>
	);
}
