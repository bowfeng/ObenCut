"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioProperties } from "./audio-properties";
import { VideoProperties } from "./video-properties";
import { TextProperties } from "./text-properties";
import { PromptProperties } from "./prompt-properties";
import { EffectProperties } from "./effect-properties";
import { ClipEffectsProperties } from "./clip-effects-properties";
import { EmptyView } from "./empty-view";
import { useEditor } from "@/hooks/use-editor";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { usePropertiesStore } from "@/stores/properties-store";
import { isVisualElement } from "@/lib/timeline";
import type { TimelineElement, TimelineTrack } from "@/types/timeline";
import { useEffect, useState } from "react";

function ElementProperties({
	track,
	element,
}: {
	track: TimelineTrack;
	element: TimelineElement;
}) {
	if (element.type === "text") {
		return <TextProperties element={element} trackId={track.id} />;
	}
	if (element.type === "prompt") {
		return <PromptProperties element={element} trackId={track.id} />;
	}
	if (element.type === "audio") {
		return <AudioProperties />;
	}
	if (
		element.type === "video" ||
		element.type === "image" ||
		element.type === "sticker"
	) {
		return <VideoProperties element={element} trackId={track.id} />;
	}
	if (element.type === "effect") {
		return <EffectProperties element={element} trackId={track.id} />;
	}
	return null;
}

export function PropertiesPanel() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const clipEffectsTarget = usePropertiesStore(
		(state) => state.clipEffectsTarget,
	);

	// 强制重新渲染以确保获取最新的元素数据
	const [forceRender, setForceRender] = useState(0);

	// 当选中元素变化时，强制重新渲染以获取最新的元素数据
	useEffect(() => {
		setForceRender((prev) => prev + 1);
	}, [selectedElements]);

	const clipEffectsTrack = clipEffectsTarget
		? editor.timeline.getTrackById({ trackId: clipEffectsTarget.trackId })
		: null;
	const clipEffectsElement = clipEffectsTrack?.elements.find(
		(element) => element.id === clipEffectsTarget?.elementId,
	);
	const isShowingClipEffects =
		clipEffectsTrack &&
		clipEffectsElement &&
		isVisualElement(clipEffectsElement);

	const elementsWithTracks = editor.timeline.getElementsWithTracks({
		elements: selectedElements,
	});

	return (
		<div className="panel bg-background h-full rounded-sm border overflow-hidden">
			{isShowingClipEffects ? (
				<ClipEffectsProperties
					element={clipEffectsElement}
					trackId={clipEffectsTrack.id}
				/>
			) : selectedElements.length > 0 ? (
				<ScrollArea className="h-full scrollbar-hidden" key={forceRender}>
					{elementsWithTracks.map(({ track, element }) => (
						<ElementProperties
							key={element.id}
							track={track}
							element={element}
						/>
					))}
				</ScrollArea>
			) : (
				<EmptyView />
			)}
		</div>
	);
}
