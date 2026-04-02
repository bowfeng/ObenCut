import type {
	ImageElement,
	StickerElement,
	VideoElement,
} from "@/types/timeline";
import { BlendingSection, TransformSection } from "./sections";
import { ImageAIGCSection } from "./sections/image-ai-generation";

export function VideoProperties({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement | StickerElement;
	trackId: string;
}) {
	// 只有图片元素才显示 AIGC 部分
	const isImage = element.type === "image";

	return (
		<div className="flex h-full flex-col">
			<TransformSection
				element={element}
				trackId={trackId}
				showTopBorder={false}
			/>
			<BlendingSection element={element} trackId={trackId} />
			{isImage && (
				<ImageAIGCSection element={element as ImageElement} trackId={trackId} />
			)}
		</div>
	);
}
