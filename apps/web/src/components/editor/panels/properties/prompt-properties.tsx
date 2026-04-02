"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { PromptElement } from "@/types/prompt-element";
import { usePropertyDraft } from "./hooks/use-property-draft";
import { useEditor } from "@/hooks/use-editor";
import {
	Section,
	SectionContent,
	SectionField,
	SectionHeader,
	SectionTitle,
} from "./section";
import { PromptAIGCSection } from "./sections/prompt-ai-generation";

export function PromptProperties({
	element,
	trackId,
}: {
	element: PromptElement;
	trackId: string;
}) {
	return (
		<div className="flex h-full flex-col">
			<PromptAIGCSection element={element} trackId={trackId} />
		</div>
	);
}

function ContentSection({
	element,
	trackId,
}: {
	element: PromptElement;
	trackId: string;
}) {
	const editor = useEditor();

	const content = usePropertyDraft({
		displayValue: element.prompt,
		parse: (input) => input,
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { prompt: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	return (
		<Section collapsible sectionKey="prompt:content" showTopBorder={false}>
			<SectionHeader>
				<SectionTitle>Prompt</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<Textarea
					placeholder="Enter prompt for AI generation..."
					value={content.displayValue}
					className="min-h-20"
					onFocus={content.onFocus}
					onChange={content.onChange}
					onBlur={content.onBlur}
				/>
			</SectionContent>
		</Section>
	);
}

function ResolutionSection({
	element,
	trackId,
}: {
	element: PromptElement;
	trackId: string;
}) {
	const editor = useEditor();

	const width = usePropertyDraft({
		displayValue: element.resolution.width.toString(),
		parse: (input) => {
			const parsed = parseInt(input);
			return Number.isNaN(parsed) ? null : Math.max(192, Math.min(7680, parsed));
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						updates: { resolution: { ...element.resolution, width: value } },
					},
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	const height = usePropertyDraft({
		displayValue: element.resolution.height.toString(),
		parse: (input) => {
			const parsed = parseInt(input);
			return Number.isNaN(parsed) ? null : Math.max(108, Math.min(4320, parsed));
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{
						trackId,
						elementId: element.id,
						updates: { resolution: { ...element.resolution, height: value } },
					},
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	return (
		<Section collapsible sectionKey="prompt:resolution">
			<SectionHeader>
				<SectionTitle>Resolution</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<div className="grid grid-cols-2 gap-4">
					<SectionField label="Width">
						<Input
							type="number"
							value={width.displayValue}
							min={192}
							max={7680}
							onFocus={width.onFocus}
							onChange={width.onChange}
							onBlur={width.onBlur}
						/>
					</SectionField>
					<SectionField label="Height">
						<Input
							type="number"
							value={height.displayValue}
							min={108}
							max={4320}
							onFocus={height.onFocus}
							onChange={height.onChange}
							onBlur={height.onBlur}
						/>
					</SectionField>
				</div>
			</SectionContent>
		</Section>
	);
}

function DurationSection({
	element,
	trackId,
}: {
	element: PromptElement;
	trackId: string;
}) {
	const editor = useEditor();

	const duration = usePropertyDraft({
		displayValue: element.duration.toFixed(1),
		parse: (input) => {
			const parsed = parseFloat(input);
			if (Number.isNaN(parsed)) return null;
			return Math.max(1, Math.min(60, parsed));
		},
		onPreview: (value) =>
			editor.timeline.previewElements({
				updates: [
					{ trackId, elementId: element.id, updates: { duration: value } },
				],
			}),
		onCommit: () => editor.timeline.commitPreview(),
	});

	return (
		<Section collapsible sectionKey="prompt:duration">
			<SectionHeader>
				<SectionTitle>Duration (s)</SectionTitle>
			</SectionHeader>
			<SectionContent>
				<SectionField label="Duration">
					<Input
						type="number"
						value={duration.displayValue}
						min={1}
						max={60}
						step={0.1}
						onFocus={duration.onFocus}
						onChange={duration.onChange}
						onBlur={duration.onBlur}
					/>
				</SectionField>
			</SectionContent>
		</Section>
	);
}
