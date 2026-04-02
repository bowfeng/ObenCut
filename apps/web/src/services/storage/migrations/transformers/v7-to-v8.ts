import type { MigrationResult, ProjectRecord } from "./types";
import { getProjectId, isRecord } from "./utils";

export function transformProjectV7ToV8({
	project,
}: {
	project: ProjectRecord;
}): MigrationResult<ProjectRecord> {
	const projectId = getProjectId({ project });
	if (!projectId) {
		return { project, skipped: true, reason: "no project id" };
	}

	if (isV8Project({ project })) {
		return { project, skipped: true, reason: "already v8" };
	}

	const migratedProject = migrateProjectElements({ project });

	return {
		project: { ...migratedProject, version: 8 },
		skipped: false,
	};
}

function migrateProjectElements({
	project,
}: {
	project: ProjectRecord;
}): ProjectRecord {
	const scenesValue = project.scenes;
	if (!Array.isArray(scenesValue)) return project;

	let hasChanges = false;
	const migratedScenes = scenesValue.map((scene) => {
		const migrated = migrateSceneElements({ scene });
		if (migrated !== scene) hasChanges = true;
		return migrated;
	});

	if (!hasChanges) return project;
	return { ...project, scenes: migratedScenes };
}

function migrateSceneElements({ scene }: { scene: unknown }): unknown {
	if (!isRecord(scene)) return scene;

	const tracksValue = scene.tracks;
	if (!Array.isArray(tracksValue)) return scene;

	let hasChanges = false;
	const migratedTracks = tracksValue.map((track) => {
		const migrated = migrateTrackElements({ track });
		if (migrated !== track) hasChanges = true;
		return migrated;
	});

	if (!hasChanges) return scene;
	return { ...scene, tracks: migratedTracks };
}

function migrateTrackElements({ track }: { track: unknown }): unknown {
	if (!isRecord(track)) return track;

	const elementsValue = track.elements;
	if (!Array.isArray(elementsValue)) return track;

	let hasChanges = false;
	const migratedElements = elementsValue.map((element) => {
		const migrated = migrateElement({ element });
		if (migrated !== element) hasChanges = true;
		return migrated;
	});

	if (!hasChanges) return track;
	return { ...track, elements: migratedElements };
}

function migrateElement({ element }: { element: unknown }): unknown {
	if (!isRecord(element)) return element;
	
	// 为视觉元素添加默认的 transform 字段
	if (element.type === "video" || element.type === "image" || element.type === "sticker") {
		const hasTransform = typeof element.transform === "object" && element.transform !== null;
		if (!hasTransform) {
			// 添加默认的 transform
			return {
				...element,
				transform: {
					scale: 1,
					position: { x: 0, y: 0 },
					rotate: 0,
				},
			};
		}
	}
	
	// 为 audio 元素添加 sourceDuration（原有的迁移逻辑）
	if (element.type === "audio") {
		const trimStart = typeof element.trimStart === "number" ? element.trimStart : 0;
		const duration = typeof element.duration === "number" ? element.duration : 0;
		const trimEnd = typeof element.trimEnd === "number" ? element.trimEnd : 0;
		
		if (typeof element.sourceDuration !== "number") {
			return {
				...element,
				sourceDuration: trimStart + duration + trimEnd,
			};
		}
	}
	
	return element;
}

function isV8Project({ project }: { project: ProjectRecord }): boolean {
	return typeof project.version === "number" && project.version >= 8;
}
